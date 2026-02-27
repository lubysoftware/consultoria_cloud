import { test, expect } from "@playwright/test";

test.describe("Formulário de contato", () => {
  test.beforeEach(async ({ page }) => {
    if (process.env.E2E_MOCK_API === "1") {
      await page.route("**/functions/v1/contacts-landings-br**", (route) => {
        if (route.request().method() === "POST") {
          route.fulfill({
            status: 200,
            contentType: "application/json",
            body: JSON.stringify({ ok: true }),
          });
        } else {
          route.continue();
        }
      });
    }
  });

  test("exibe os 4 campos e o botão de envio", async ({ page }) => {
    await page.goto("");
    await page.locator("#contato").scrollIntoViewIfNeeded();

    await expect(page.getByPlaceholder("Nome completo")).toBeVisible();
    await expect(page.getByPlaceholder("E-mail")).toBeVisible();
    await expect(page.getByPlaceholder("(00) 00000-0000")).toBeVisible();
    await expect(page.getByPlaceholder("Descreva sua necessidade ou dúvida")).toBeVisible();
    await expect(page.locator("#contato form button[type='submit']")).toBeVisible();
  });

  test("preenche e envia o formulário com sucesso", async ({ page }) => {
    await page.goto("");
    await page.locator("#contato").scrollIntoViewIfNeeded();

    const responsePromise = page.waitForResponse(
      (res) =>
        res.url().includes("contacts-landings-br") &&
        res.request().method() === "POST",
      { timeout: 15_000 }
    );

    await page.getByPlaceholder("Nome completo").fill("TESTE Karime");
    await page.getByPlaceholder("E-mail").fill("karime.kumagai@luby.com.br");
    await page.getByPlaceholder("(00) 00000-0000").fill("44998885133");
    await page.getByPlaceholder("Descreva sua necessidade ou dúvida").fill("pipipopo pipipopo");

    await page.locator("#contato form button[type='submit']").click();

    const response = await responsePromise;
    const status = response.status();
    const body = await response.text();
    if (process.env.E2E_MOCK_API !== "1") {
      console.log("[E2E real API] POST contacts-landings-br → status:", status, "body:", body);
    }

    await expect(page.getByText("Mensagem enviada!").first()).toBeVisible({ timeout: 10_000 });

    if (process.env.E2E_MOCK_API !== "1" && status !== 200) {
      throw new Error(`Edge function retornou ${status}. Body: ${body}`);
    }
  });

  test("mostra erro ao enviar com telefone inválido", async ({ page }) => {
    await page.goto("");
    await page.locator("#contato").scrollIntoViewIfNeeded();

    await page.getByPlaceholder("Nome completo").fill("TESTE Karime");
    await page.getByPlaceholder("E-mail").fill("karime.kumagai@luby.com.br");
    await page.getByPlaceholder("(00) 00000-0000").fill("123");
    await page.locator("#contato form button[type='submit']").click();

    await expect(page.getByText("Telefone inválido").first()).toBeVisible({ timeout: 5_000 });
  });
});
