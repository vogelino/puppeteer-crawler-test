"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const puppeteer_1 = __importDefault(require("puppeteer"));
const node_fs_1 = __importDefault(require("node:fs"));
(async () => {
    const browser = await puppeteer_1.default.launch({ headless: true });
    const page = await startWithPage("https://www.vogelino.com/");
    const projectsSelector = ".tl-wrapper > ul > li";
    await page.waitForSelector(projectsSelector);
    const projects = await page.$$eval(projectsSelector, (projects) => projects.map((p) => {
        var _a, _b, _c;
        return ({
            url: ((_a = p.querySelector("a")) === null || _a === void 0 ? void 0 : _a.href) || '',
            title: ((_b = p.querySelector("h2")) === null || _b === void 0 ? void 0 : _b.innerText) || '',
            excerpt: ((_c = p.querySelector("p")) === null || _c === void 0 ? void 0 : _c.innerText) || '',
            thumbnail: p.querySelector("picture img").src,
        });
    }));
    const enhancedProjects = [];
    for (const project of projects) {
        const enhancedProject = await getCrawledProject(page, project);
        enhancedProjects.push(enhancedProject);
    }
    const json = JSON.stringify(enhancedProjects, null, 2);
    node_fs_1.default.writeFileSync("vogelino.json", json);
    await browser.close();
})();
async function getCrawledProject(page, projectBase) {
    await page.goto(projectBase.url);
    await page.waitForTimeout(2000);
    const contentParagraphsSelector = ".tl-wrapper > div:nth-of-type(3) p";
    const metadataParentsSelector = ".tl-wrapper > div:nth-of-type(3) > div > div:nth-of-type(2) > li";
    const content = await page.$$eval(contentParagraphsSelector, (paragraphs) => paragraphs
        .map((paragraph) => paragraph.innerHTML.trim())
        .join("\n\n"));
    const participants = {};
    await page.$$eval(metadataParentsSelector, (parents) => parents.map(async (parent) => {
        var _a, _b;
        const groupTitle = ((_a = parent.querySelector("h4")) === null || _a === void 0 ? void 0 : _a.innerText) || 'title';
        const key = groupTitle
            .replace(/\s(.)/g, ($1) => $1.toUpperCase())
            .replace(/\s/g, "")
            .replace(/^(.)/, ($1) => $1.toLowerCase()) || 'title';
        const peopleSelector = `${metadataParentsSelector} > ul > li > a`;
        const people = await page.$$eval(peopleSelector, (peopleAs) => peopleAs.map((a) => {
            var _a;
            return ({
                link: a.href,
                name: a.innerText,
                avatar: ((_a = a.querySelector("img")) === null || _a === void 0 ? void 0 : _a.src) || '',
            });
        }));
        if (people.length > 0) {
            participants[key] = ((_b = parent
                .querySelector("li")) === null || _b === void 0 ? void 0 : _b.innerText.replace(groupTitle, "").trim()) || '';
            return;
        }
        participants[key] = {
            title: groupTitle,
            items: people,
        };
    }));
    return {
        ...projectBase,
        content,
        participants,
    };
}
async function startWithPage(pageURL) {
    const browser = await puppeteer_1.default.launch({ headless: false });
    const page = await browser.newPage();
    await page.setViewport({ width: 1080, height: 800 });
    await page.goto(pageURL);
    await page.waitForTimeout(2000);
    return page;
}
