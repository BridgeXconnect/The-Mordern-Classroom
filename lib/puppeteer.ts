import chromium from "@sparticuz/chromium";
import puppeteerCore from "puppeteer-core";
import { uploadToR2 } from "./r2";

/**
 * Get a Puppeteer browser instance.
 * Uses @sparticuz/chromium on Vercel (fits within 50MB function limit).
 * Falls back to local Chromium for development.
 */
async function getBrowser() {
  const isVercel = process.env.VERCEL === "1";

  if (isVercel) {
    return puppeteerCore.launch({
      args: chromium.args,
      defaultViewport: chromium.defaultViewport,
      executablePath: await chromium.executablePath(),
      headless: true,
    });
  }

  // Local development — use system Chromium or Chrome
  return puppeteerCore.launch({
    args: ["--no-sandbox", "--disable-setuid-sandbox"],
    executablePath:
      process.env.PUPPETEER_EXECUTABLE_PATH ??
      "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome",
    headless: true,
  });
}

export interface InfographicOptions {
  width?: number;
  height?: number;
  deviceScaleFactor?: number;
}

/**
 * Render an HTML string to a PNG image via Puppeteer.
 * Uploads the result to R2 and returns the public URL.
 *
 * @param html - Full HTML document string (inline CSS supported)
 * @param options - Viewport/scale options
 * @returns Public R2 URL of the generated PNG
 */
export async function renderHtmlToPng(
  html: string,
  options: InfographicOptions = {}
): Promise<string> {
  const { width = 1200, height = 800, deviceScaleFactor = 2 } = options;

  const browser = await getBrowser();

  try {
    const page = await browser.newPage();
    await page.setViewport({ width, height, deviceScaleFactor });
    await page.setContent(html, { waitUntil: "networkidle0" });

    const screenshot = await page.screenshot({
      type: "png",
      fullPage: false,
      clip: { x: 0, y: 0, width, height },
    });

    const buffer = Buffer.from(screenshot);
    const url = await uploadToR2(buffer, "infographics", "image/png");

    return url;
  } finally {
    await browser.close();
  }
}

/**
 * Render an HTML string to PDF via Puppeteer.
 * Returns a Buffer (not uploaded — streamed directly to client for worksheets).
 */
export async function renderHtmlToPdf(html: string): Promise<Buffer> {
  const browser = await getBrowser();

  try {
    const page = await browser.newPage();
    await page.setContent(html, { waitUntil: "networkidle0" });

    const pdf = await page.pdf({
      format: "A4",
      printBackground: true,
      margin: { top: "20mm", right: "15mm", bottom: "20mm", left: "15mm" },
    });

    return Buffer.from(pdf);
  } finally {
    await browser.close();
  }
}
