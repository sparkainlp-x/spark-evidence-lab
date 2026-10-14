import sys, asyncio
from playwright.sync_api import sync_playwright
url = sys.argv[1]
with sync_playwright() as p:
    b = p.chromium.launch()
    errs = []
    for name, w, h in [("screenshot.png", 1280, 800), ("screenshot-mobile.png", 390, 844)]:
        pg = b.new_page(viewport={"width": w, "height": h}, device_scale_factor=1 if w > 500 else 2)
        pg.on("pageerror", lambda e: errs.append(str(e))); pg.on("console", lambda m: m.type == "error" and errs.append(m.text))
        pg.goto(url); pg.wait_for_timeout(2500); pg.screenshot(path=name)
        if w > 500: pg.screenshot(path="full.png", full_page=True)
    print("errors:", errs)
    b.close()
