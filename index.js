const puppeteer = require('puppeteer');

const delay = (t) => new Promise((resolve) => setTimeout(resolve, t * 1_000));

const baseUrl =
  'https://www.hauts-de-seine.gouv.fr/Demarches-administratives/Etrangers-en-France/SEJOUR/SEJOUR-prefecture-de-Nanterre/Remise-de-titre';

const choices = [
  "Remise d'un titre de séjour - GUICHET 1B - Nanterre",
  "Remise d'un titre de séjour - GUICHET 4 B - Nanterre",
  "Remise d'un titre de séjour - GUICHET 3 B - Nanterre",
  "Remise d'un titre de séjour - GUICHET 2B - Nanterre",
];

(async () => {
  try {
    const browser = await puppeteer.launch();
    const page = await browser.newPage();

    await page.goto(baseUrl);

    const frame = page.mainFrame();

    {
      const element = await frame.waitForSelector('aria/en cliquant ici');
      await element.click();
      await page.waitForNavigation();
    }

    for (let i = 0; i < choices.length; i++) {
      const choice = choices[i];

      try {
        {
          const element = await frame.waitForSelector(
            "aria/Veuillez cocher la case pour accepter les conditions d'utilisation avant de continuer le processus de prise de rendez-vous."
          );
          await element.click();
        }
        {
          const element = await frame.waitForSelector('aria/Effectuer une demande de rendez-vous');
          await element.click();
          await page.waitForNavigation();
        }

        // Choix guichet
        {
          const element = await frame.waitForSelector(`aria/${choice}`);
          await element.click();
        }
        {
          const element = await frame.waitForSelector('aria/Etape suivante');
          await element.click();
          await page.waitForNavigation();
        }

        // Resultat
        {
          await page.screenshot({ path: 'example.png' });

          const text = await page.evaluate(() =>
            Array.from(document.querySelectorAll('#FormBookingCreate'), (element) => element.textContent.trim())
          );
          const rdvDispo = !text[0].includes(`Il n'existe plus de plage horaire libre`);

          console.log(`${choice} : ${text[0]}`);
          console.log(`Rendez-vous disponible? ${rdvDispo ? 'OUI' : 'NON'}`);

          if (rdvDispo) {
            break;
          }
        }

        // Next choice
        {
          const element = await frame.waitForSelector('aria/Terminer');
          await element.click();
          await page.waitForNavigation();
        }

        await delay(10);
      } catch (error) {
        onError(browser, error)
      }
    }

    await browser.close();
  } catch (error) {
    onError(browser, error)
  }
})();

async function onError(browser, error) {
  console.log(`EROR: ${error}`);
  await browser.close();
}
