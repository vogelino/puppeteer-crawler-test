import puppeteer from "puppeteer";
import fs from "node:fs";

interface ProjectBaseType {
  url: string;
  title: string;
  excerpt: string;
  thumbnail: string;
}

interface ParticipantType {
  link: string;
  name: string;
  avatar: string;
}

interface ParticipantsBlockType {
  title: string,
  people: ParticipantType[],
}

type MetadataType = string | ParticipantsBlockType;

const getInitialPage = async (pageURL: string): Promise<puppeteer.Page> => {
  const browser = await puppeteer.launch({ headless: false });
  const page = await browser.newPage();
  await page.setViewport({ width: 1080, height: 800 });
  await page.goto(pageURL);
  await page.waitForTimeout(2000);
  return page;
}

const getCrawledContent = async (page: puppeteer.Page) => {
  const contentParagraphsSelector = ".tl-wrapper > div:nth-of-type(3) p";
  return await page.$$eval(contentParagraphsSelector, (paragraphs) => paragraphs
    .map((paragraph) => (paragraph as HTMLParagraphElement).innerText.trim())
    .join("\n\n")
  );
}

const getCrawledMetadata = async (page: puppeteer.Page) => {
  const metadataParentsSelector =
    ".tl-wrapper > div:nth-of-type(3) > div > div:nth-of-type(2) > li";

  return await page.$$eval(metadataParentsSelector, (parents) =>
    parents.reduce((acc, p) => {
      const parent = p as HTMLParagraphElement;
      const groupTitle = parent.querySelector("h4")?.innerText || 'title';
      const key = groupTitle
        .replace(/\s(.)/g, ($1: string): string => $1.toUpperCase())
        .replace(/\s/g, "")
        .replace(/^(.)/, ($1: string): string => $1.toLowerCase()) || 'title';

      const links = Array.from(parent.querySelectorAll("a"));
      const people = links.map((a) => ({
        link: a.href,
        name: a.innerText,
        avatar: a.querySelector('span')?.getAttribute('src') || '',
      }))

      return {
        ...acc,
        [key]: people.length === 0 ? parent.innerText?.replace(groupTitle, '').trim() : {
          title: groupTitle,
          people,
        }
      };
    }, {} as { [key: string]: MetadataType })
  );
}

const getCrawledProject = async (page: puppeteer.Page, projectBase: ProjectBaseType) => {
  await page.goto(projectBase.url);
  await page.waitForTimeout(2000);

  const content = await getCrawledContent(page);
  const metadata = await getCrawledMetadata(page);

  return {
    ...projectBase,
    content,
    metadata,
  };
}

const getCrawledProjects = async (page: puppeteer.Page) => {
  const projectsSelector = ".tl-wrapper > ul > li";
  await page.waitForSelector(projectsSelector);
  const projects = await page.$$eval(projectsSelector, (projects) =>
    projects.map((p): ProjectBaseType => ({
      url: p.querySelector("a")?.href || '',
      title: p.querySelector("h2")?.innerText || '',
      excerpt: p.querySelector("p")?.innerText || '',
      thumbnail: (p.querySelector("picture img") as HTMLImageElement).src,
    }))
  );

  const projectsPromises = projects.map((project) => getCrawledProject(page, project));
  return await Promise.all(projectsPromises);
}

const crawlWebsite = async () => {
  const browser = await puppeteer.launch({ headless: true });
  const page = await getInitialPage("https://www.vogelino.com/");

  const projects = await getCrawledProjects(page);

  const json = JSON.stringify(projects, null, 2);
  fs.writeFileSync("vogelino.json", json);

  await browser.close();
};

crawlWebsite();