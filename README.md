# puppeteer-crawler-test
A repo gathering [puppeteer](https://pptr.dev) crawling tests for experimentation purpose.
 
This test uses my [own overly outdated portfolio](https://vogelino.com/) as a crawled website in order to test puppeteer. My website is programmed with sytled components, which generates unreadable CSS classes on DOM elements and makes the definition of selectors complicated. Additionally, it doesn't use well structured, semantic HTML which also makes the crawling more challenging. However, this just makes the test even more realistic, as many website will face similar issues. The main personal lesson I draw from this exercise is that crawling my own website helped me noticing various issues and value semantic HTML event more! 😅

## Get started
Clone the repository, enter it and install the dependencies
```sh
$ git clone git@github.com:vogelino/puppeteer-crawler-test.git
$ cd puppeteer-crawler-test
$ npm install
```

Then run the script
```sh
$ npm start
```

A new export should appear in the `exports` folder
