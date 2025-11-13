import path from 'node:path';
import pluginSyntaxHighlight from "@11ty/eleventy-plugin-syntaxhighlight";
import pluginNavigation from "@11ty/eleventy-navigation";
import markdownIt from "markdown-it";
import markdownItAnchor from "markdown-it-anchor";

import * as sass from 'sass';

export default function(eleventyConfig) {
  eleventyConfig.addPlugin(pluginSyntaxHighlight);
  eleventyConfig.addPlugin(pluginNavigation);

  eleventyConfig.setDataDeepMerge(true);

  eleventyConfig.addExtension('scss', {
    outputFileExtension: 'css',
    useLayouts: false,
    compile: async function (inputContent, inputPath) {
      const parsed = path.parse(inputPath);
      if (parsed.name.startsWith('_')) {
        return;
      }
      const result = sass.compileString(inputContent, {
        loadPaths: [
          parsed.dir || '.',
          this.config.dir.includes,
        ]
      });
      this.addDependencies(inputPath, result.loadedUrls);
      return async (data) => {
        return result.css;
      }
    }
  });
  eleventyConfig.addTemplateFormats('scss');

  eleventyConfig.addFilter('markdown', (value) => {
    const markdown = markdownIt({
      html: true
    });
    return markdown.render(value);
  });


  // Get the first `n` elements of a collection.
  eleventyConfig.addFilter("head", (array, n) => {
    if( n < 0 ) {
      return array.slice(n);
    }

    return array.slice(0, n);
  });

  eleventyConfig.addFilter('projectValue', (array) => {
    return array.sort((a, b) => {
      return a.data.value - b.data.value;
    })
  });

  eleventyConfig.setServerPassthroughCopyBehavior("passthrough");
  eleventyConfig.addPassthroughCopy("content/img");
  eleventyConfig.addPassthroughCopy("content/css");
  eleventyConfig.addPassthroughCopy("content/script");
  eleventyConfig.addPassthroughCopy("content/favicon*");

  eleventyConfig.addWatchTarget("./.env");

  /* Markdown Overrides */
  let markdownLibrary = markdownIt({
    html: true,
    breaks: true,
    linkify: true
  }).use(markdownItAnchor, {
    permalink: true,
    permalinkClass: "direct-link",
    permalinkSymbol: "#"
  });
  eleventyConfig.setLibrary("md", markdownLibrary);

  // Browsersync Overrides
  eleventyConfig.setBrowserSyncConfig({
    callbacks: {
      ready: function(err, browserSync) {
        const content_404 = readFileSync('_site/404.html');

        browserSync.addMiddleware("*", (req, res) => {
          // Provides the 404 content without redirect.
          res.write(content_404);
          res.end();
        });
      },
    },
    ui: false,
    ghostMode: false
  });

  return {
    templateFormats: [
      "md",
      "njk",
      "html",
      "liquid"
    ],

    // if the site lives in a subdirectory when hosted:
    // pathPrefix: "/",

    markdownTemplateEngine: "liquid",
    htmlTemplateEngine: "njk",
    dataTemplateEngine: "njk",

    dir: {
      input: "content",
      includes: "../_includes", // this is relative to `input`
      data: "../_data",         // this is relative to `input`
      output: "_site"
    }
  };
};
