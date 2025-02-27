// Name: Varun Deep Singh
const fs = require('fs');
const markdownIt = require("markdown-it");
require('dotenv').config();
const { type } = require('os');

module.exports=function(eleventyConfig){
  const md = new markdownIt({
    html: true, // Preserve existing HTML
  breaks: true, // Convert newlines to <br>
  linkify: true,
  });

  // Register the markdown filter
  eleventyConfig.addFilter("markdown", (content) => {
    return md.render(content); // Convert Markdown to HTML
  });


    const directoryPath='/dist';
    eleventyConfig.addPassthroughCopy("src/css");
    eleventyConfig.addPassthroughCopy("src/img");
    eleventyConfig.addPassthroughCopy("src/webhooks");
    eleventyConfig.addPassthroughCopy("src/JS")
    eleventyConfig.on("eleventy.before", async ({ dir, runMode, outputMode }) => {
		
        fs.rm(directoryPath, { recursive: true, force: true }, (err) => {
            if (err) {
                console.error('Error deleting directory:', err);
            } else {
                console.log('Directory and its contents deleted successfully');
            }
        });


        
	});







  function extractFieldsWithImages(data) {
    // Create a mapping of asset IDs to their image URLs
    const assetMap = {};
    if (data.includes && data.includes.Asset) {
        data.includes.Asset.forEach(asset => {
            if (asset.sys.id && asset.fields.file && asset.fields.file.url) {
                assetMap[asset.sys.id] = "https:" + asset.fields.file.url;
            }
        });
    }

    // Extract and transform the fields with the corresponding image URL and createdAt
    return data.items.map(item => {
        const imageId = item.fields.image?.sys?.id;
        const imageUrl = assetMap[imageId] || null;
        
        return {
            name: item.fields.name,
            enabled: item.fields.enabled,
            publishedAt: item.fields.publishedAt,
            type: item.fields.type,
            github: item.fields.github,
            desc: item.fields.desc,
            createdAt: item.sys.createdAt,  // Keeping the exact date from sys.createdAt
            image: imageUrl
        };
    });
}

  
// FETCH LIMIT CHANGED IN STRAPI
  async function fetchStrapiData() {
    try{
      const BEARER_1=process.env.BEARER_1;
      // http://localhost:1337/api/mycollections?filters[type][$eq]=lion
      const r =await fetch("https://cdn.contentful.com/spaces/kscoxmtenzwm/environments/master/entries?content_type=mycollection&order=sys.createdAt", {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${BEARER_1}`
        },
      })
        const data= await r.json();
        const data2=extractFieldsWithImages(data);
        console.log("Fetched data from ContentFul");
       return data2;
      }
      catch(err){
        console.error(err);
        return [];
      }
  }
  
  eleventyConfig.addGlobalData("strapi_data", async () => {
    const data = await fetchStrapiData(); 
    return data;

//to see a particular type

    // const uniqueTypes = [...new Set(data.map((item) => item.type))];
    // console.log("unique types",uniqueTypes);
    // const selectedCollection = data.filter(item => item.type === 'dog');
    // return selectedCollection; 
  });
  


  //for demo only it was used for strapi but the code now uses contentful
  // eleventyConfig.addCollection("types", async () => {
  //   const data=await fetchStrapiData();
  //   data=data.items;
  //   data=data.fields;
  //   const uniqueTypes = [...new Set(data.map((item) => item.type))];
  //   console.log("unique types",uniqueTypes);
    

  //     return uniqueTypes;
  // })

// This is for demo
  eleventyConfig.addGlobalData("collect",async ()=>{
    const data=await fetchStrapiData();
    console.log("Made Collection for different types of data");
    const uniqueTypes = [...new Set(data.map((item) => item.type))];
    array_of_collections=[data]
    uniqueTypes.forEach((type) => {
      array_of_collections.push(data.filter((item) => item.type === type));
    });
      return array_of_collections
  });


  eleventyConfig.addGlobalData("strapi_posts", async () =>{
    try{
      const BEARER_1=process.env.BEARER_1;
      // const STRAPI_BEARER_2="2GyvQjwGi7pj-NY7qHRtxzQAZ97w3JUunYfBkjp6b0Q";
      const r =await fetch("https://cdn.contentful.com/spaces/kscoxmtenzwm/environments/master/entries?content_type=writeups&order=sys.createdAt",{ method: "GET",
        headers: {
          "Content-Type": "application/json",
          "Authorization":`Bearer ${BEARER_1}`
        },})
        console.log("Fetched writeups for the Projects");
        const data= await r.json();
        const data2 = data.items.map((post) => ({
          ...post, 
          write_up: md.render(post.fields.writeUp), 
        }));
        return data2;
      }
      catch(err){
      console.error(err);
      return [];
    }
  });

    eleventyConfig.setBrowserSyncConfig({
       files: './_site/**/*',
        callbacks: {
          ready: function(err, browserSync) {
            const content404 = fs.readFileSync("404.html");
    
            browserSync.addMiddleware("*", (req, res) => {
              res.write(content404);
              res.end();
            });
          }
        }
      });
   
    return {
        dir:{output:"dist",
        input:"src"
        },
        templateFormats: ["md", "ejs"], // Ensure EJS is in the list of supported template formats
        markdownTemplateEngine: "ejs",  // Set EJS as the template engine for Markdown
        htmlTemplateEngine: "ejs",
        dataTemplateEngine: "ejs"
    };
} 