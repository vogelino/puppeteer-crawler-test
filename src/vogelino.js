const puppeteer = require("puppeteer");
const fs = require("node:fs");

// Initialises the browser, sets dimensions and waits for the page to load
const getInitialPage = async (pageURL) => {
  const browser = await puppeteer.launch({ headless: false });
  const page = await browser.newPage();
  await page.setViewport({ width: 1080, height: 800 });
  await page.goto(pageURL);
  await page.waitForTimeout(2000);
  return { page, browser };
};

// Grabs the main text content from the paragraphs
const getCrawledContent = async (page) => {
  const contentParagraphsSelector = ".tl-wrapper > div:nth-of-type(3) p";
  return await page.$$eval(contentParagraphsSelector, (paragraphs) =>
    paragraphs.map((paragraph) => paragraph.innerText.trim()).join("\n\n")
  );
};

// Crawls contents from the sidebar
const getCrawledMetadata = async (page) => {
  const metadataParentsSelector =
    ".tl-wrapper > div:nth-of-type(3) > div > div:nth-of-type(2) > li";
  return await page.$$eval(metadataParentsSelector, (parents) =>
    parents.reduce((acc, parent) => {
      const groupTitle = parent.querySelector("h4").innerText || "title";
      const key =
        groupTitle
          .replace(/\s(.)/g, ($1) => $1.toUpperCase())
          .replace(/\s/g, "")
          .replace(/^(.)/, ($1) => $1.toLowerCase()) || "title";
      const links = Array.from(parent.querySelectorAll("a"));
      const people = links.map((a) => ({
        link: a.href,
        name: a.innerText,
        avatar: a.querySelector("span")?.getAttribute("src") || "",
      }));
      return {
        ...acc,
        [key]:
          people.length === 0
            ? parent.innerText.replace(groupTitle, "").trim()
            : people,
      };
    }, {})
  );
};

// Crawls a single project page to enhance inforamtion gathered on the home page
const getCrawledProject = async (page, projectBase) => {
  await page.goto(projectBase.url);
  await page.waitForTimeout(2000);
  const content = await getCrawledContent(page);
  const metadata = await getCrawledMetadata(page);
  return {
    ...projectBase,
    content,
    metadata,
  };
};

// Crawls the main page to get the projects and then crawls each project page
const getCrawledProjects = async (page) => {
  const projectsSelector = ".tl-wrapper > ul > li";
  const projects = await page.$$eval(projectsSelector, (projects) =>
    projects.map((p) => ({
      url: p.querySelector("a")?.href || "",
      title: p.querySelector("h2")?.innerText || "",
      excerpt: p.querySelector("p")?.innerText || "",
      thumbnail: p.querySelector("picture img").src,
    }))
  );
  const enhancedProjects = [];
  for (const project of projects) {
    const enhancedProject = await getCrawledProject(page, project);
    enhancedProjects.push(enhancedProject);
  }
  return enhancedProjects;
};

// Initial function that starts the crawling of the page
const crawlWebsite = async () => {
  const { browser, page } = await getInitialPage("https://www.vogelino.com/");
  const projects = await getCrawledProjects(page);
  const json = JSON.stringify(projects, null, 2);
  fs.writeFile("exports/vogelino.json", json, () => {
    browser.close();
  });
};

crawlWebsite();
