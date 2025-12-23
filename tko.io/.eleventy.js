import markdownIt from "markdown-it";

export default function(eleventyConfig) {
  // Follow symlinks
  eleventyConfig.setServerOptions({
    followSymlinks: true
  });

  // Copy static assets
  eleventyConfig.addPassthroughCopy("src/css");
  eleventyConfig.addPassthroughCopy("src/js");
  eleventyConfig.addPassthroughCopy("src/CNAME");

  // Watch for changes
  eleventyConfig.addWatchTarget("src/css/");
  eleventyConfig.addWatchTarget("src/js/");

  // Configure markdown
  const md = markdownIt({
    html: true,
    breaks: false,
    linkify: true
  });

  eleventyConfig.setLibrary("md", md);

  // Create collections for each documentation category
  eleventyConfig.addCollection("bindingDocs", function(collectionApi) {
    return collectionApi.getFilteredByGlob("src/docs/bindings/*.md")
      .filter(page => !page.url.endsWith('/bindings/'))
      .sort((a, b) => a.fileSlug.localeCompare(b.fileSlug));
  });

  eleventyConfig.addCollection("observableDocs", function(collectionApi) {
    return collectionApi.getFilteredByGlob("src/docs/observables/*.md")
      .filter(page => !page.url.endsWith('/observables/'))
      .sort((a, b) => a.fileSlug.localeCompare(b.fileSlug));
  });

  eleventyConfig.addCollection("computedDocs", function(collectionApi) {
    return collectionApi.getFilteredByGlob("src/docs/computed/*.md")
      .filter(page => !page.url.endsWith('/computed/'))
      .sort((a, b) => a.fileSlug.localeCompare(b.fileSlug));
  });

  eleventyConfig.addCollection("componentDocs", function(collectionApi) {
    return collectionApi.getFilteredByGlob("src/docs/components/*.md")
      .filter(page => !page.url.endsWith('/components/'))
      .sort((a, b) => a.fileSlug.localeCompare(b.fileSlug));
  });

  eleventyConfig.addCollection("bindingContextDocs", function(collectionApi) {
    return collectionApi.getFilteredByGlob("src/docs/binding-context/*.md")
      .filter(page => !page.url.endsWith('/binding-context/'))
      .sort((a, b) => a.fileSlug.localeCompare(b.fileSlug));
  });

  eleventyConfig.addCollection("advancedDocs", function(collectionApi) {
    return collectionApi.getFilteredByGlob("src/docs/advanced/*.md")
      .filter(page => !page.url.endsWith('/advanced/'))
      .sort((a, b) => a.fileSlug.localeCompare(b.fileSlug));
  });

  // Add filter to format titles from file slugs
  eleventyConfig.addFilter("formatTitle", function(slug) {
    return slug
      .split('-')
      .map(word => word.charAt(0).toUpperCase() + word.slice(1))
      .join(' ');
  });

  // Add filter to format binding names (keeps lowercase, removes -binding suffix)
  eleventyConfig.addFilter("formatBindingName", function(slug) {
    return slug.replace(/-binding$/, '');
  });

  return {
    dir: {
      input: "src",
      output: "_site",
      includes: "_includes",
      layouts: "_layouts"
    },
    markdownTemplateEngine: "njk",
    htmlTemplateEngine: "njk"
  };
}
