var options = {
  "accountId": 21 // quill
};

var fs = require("fs");
var sys = require("sys");

var Sequelize = require("sequelize");
var builder = require('xmlbuilder');
var markdown = require("node-markdown").Markdown;

var timeZoneOffsets = {
  "Newfoundland": -4.5,
  "Atlantic Time (Canada)": -4,
  "Eastern Time (US & Canada)": -3,
  "Central Time (US & Canada)": -2,
  "Saskatchewan": -6,
  "Mountain Time (US & Canada)": -1,
  "Pacific Time (US & Canada)": 0
}

var sequelize = new Sequelize('hotink', 'hotink', 'HDx96NuZCR6Yr9jK3mjYWq8G', {
  host: "localhost",
  port: 3306
});

var Accounts = sequelize.define('accounts', { }, {
  freezeTableName: true
});
Accounts.sync();

var Documents = sequelize.define('documents', { }, {
  freezeTableName: true
});
Documents.sync();

var Authorships = sequelize.define('authorships', { }, {
  freezeTableName: true
});
Authorships.sync();

var Authors = sequelize.define('authors', { }, {
  freezeTableName: true
});
Authors.sync();

var rss = builder.begin("rss", {version: "1.0", encoding: "utf-8"});
rss.comment("hotink-exporter v0.1.0");
rss.att("xmlns:wp", "http://wordpress.org/export/1.0/");
rss.att("xmlns:content", "http://purl.org/rss/1.0/modules/content/");

Authors.findAll({where: {account_id: options.accountId}}).on('success', function(authors) {
  authorsById = {};
  for (var i = 0; i < authors.length; i++) {
    authorsById[authors[i].id] = authors[i];
  }
  Authorships.findAll().on("success", function(authorships) {
    authorshipsById = {};
    for (var i = 0; i < authorships.length; i++) {
      if (authorshipsById[authorships[i].document_id] == undefined) {
        if (authorsById[authorships[i].author_id]) {
          authorshipsById[authorships[i].document_id] = authorsById[authorships[i].author_id].name;
        }
      } else {
        if (authorsById[authorships[i].author_id]) {
          authorshipsById[authorships[i].document_id] += ", " +  authorsById[authorships[i].author_id].name;
        }
      }
    }

    Accounts.find(options.accountId).on('success', function(account) {
      var channel = rss.ele("channel");
      channel.ele("wp:wxr_version").txt("1.1");
      channel.ele("title").txt(account.formal_name);
      channel.ele("link").txt(account.site_url);
      channel.ele("language").txt("en-CA");
      channel.ele("generator").txt("http://hotink.net/");
      channel.ele("wp:base_site_url").txt(account.site_url);
      channel.ele("wp:base_blog_url").txt(account.site_url);

      Documents.findAll({where: {account_id: options.accountId}}).on('success', function(documents) {
        for (var i = 0; i < documents.length; i++) {
          try {
            var item = channel.ele("item");

            // wp:post_id
            item.ele("wp:post_id").txt(i);

            // title
            if (documents[i].title != null && documents[i].title != "") {
              item.ele("title").txt(documents[i].title);
            }

            // meta: hotink_authors (comma-separated list of authors)
            var hotinkAuthorsPostmeta = item.ele("wp:postmeta");
            hotinkAuthorsPostmeta.ele("wp:meta_key").txt("hotink_authors");
            if (authorshipsById[documents[i].id]) {
              hotinkAuthorsPostmeta.ele("wp:meta_value").txt(authorshipsById[documents[i].id]);
            } else {
              hotinkAuthorsPostmeta.ele("wp:meta_value")
            }

            // meta: hotink_id (old Hot Ink id -- good for 301 redirects to new permalinks and other bridge functionality)
            var hotinkIdPostmeta = item.ele("wp:postmeta");
            hotinkIdPostmeta.ele("wp:meta_key").txt("hotink_id");
            if (documents[i].id) {
              hotinkIdPostmeta.ele("wp:meta_value").txt(documents[i].id);
            } else {
              hotinkIdPostmeta.ele("wp:meta_value")
            }

            // link, guid
            if (account.site_url[account.site_url.length - 1] == "/") {
              item.ele("link").txt(account.site_url + "articles/" + documents[i].id + "/");
              item.ele("guid").txt(account.site_url + "articles/" + documents[i].id + "/");
            } else {
              item.ele("link").txt(account.site_url + "/articles/" + documents[i].id + "/");
              item.ele("guid").txt(account.site_url + "/articles/" + documents[i].id + "/");
            }

            // wp:status
            if (documents[i].status != null) {
              if (documents[i].status == "Published") {
                item.ele("wp:status").txt("publish");
              } else if (documents[i].status == "Awaiting attention") {
                item.ele("wp:status").txt("pending");
              }
            }

            // pubdate (PLACEHOLDER!)
            item.ele("pubdate").txt("Tue, 26 Jul 2011 18:01:24 +0000");

            // wp:post_date
            if (documents[i].published_at != null) {
              var date = documents[i].published_at;
              date = new Date(date.getTime() + ((timeZoneOffsets[account.time_zone] + date.getDSTOffset()) * 60 * 60 * 1000));
              item.ele("wp:post_date").txt(date.toDateString());
            }

            // wp:post_date_gmt
            if (documents[i].published_at != null) {
              gmtDate = new Date(date.getTime() + (8 + timeZoneOffsets[account.time_zone] - date.getDSTOffset()) * 60 * 60 * 1000);
              item.ele("wp:post_date_gmt").txt(gmtDate.toDateString());
            }

            // wp:post_type
            item.ele("wp:post_type").txt("post");

            // wp:post_name (PLACEHOLDER!)
            item.ele("wp:post_name").txt("test");

            // wp:post_parent
            item.ele("wp:post_parent").txt("0");

            // wp:menu_order
            item.ele("wp:menu_order").txt("0");

            // wp:post_password
            item.ele("wp:post_password");

            // wp:is_sticky
            item.ele("wp:is_sticky").txt("0");

            // wp:comment_status
            item.ele("wp:comment_status").txt("closed");

            // wp:ping_status
            item.ele("wp:ping_status").txt("closed");

            // excerpt:encoded, content:encoded
            if (documents[i].bodytext != null) {
              var bodyText = markdown(documents[i].bodytext).replace(/\u0000/g, "");
              item.ele("excerpt:encoded").cdata("");
              item.ele("content:encoded").cdata(bodyText);
            }

            // category (PLACEHOLDER!)
            item.ele("category").att("domain", "category")
                                .att("nicename", "uncategorized")
                                .cdata("Uncategorized");

            // DEBUG
            if (documents[i].id == 20360) {
              // console.log(dateString);
            }
          } catch(err) {
            console.log(err);
            // console.log(documents[i]);
          }
        }

        fs.writeFile("export.xml", builder.toString(), function(err) {
          if(err) {
            sys.puts(err);
          } else {
            sys.puts("The file was saved!");
          }
        });
      });
    });
  });
});


function pad(n) {
  if (n < 10) {
    return "0" + n;
  } else {
    return n;
  }
}

Date.prototype.getDSTOffset = function() {
  // "...second Sunday in March to the first Sunday in November"
  month = this.getUTCMonth();
  if (month <= 1) {
    return 0;
  } else if (month == 2) {
    if (this.getSundayNumber() < 2) {
      return 0;
    } else {
      return 1;
    }
  } else if (month >= 3 && month <= 9) {
    return 1;
  } else if (month == 10) {
    if (this.getSundayNumber() <= 1) {
      return 1;
    } else {
      return 0;
    }
  } else if (month == 11) {
    return 0;
  }
}

Date.prototype.getSundayNumber = function() {
  var month = this.getUTCMonth();
  var tempDate = this;
  var sundays = 0;
  while (tempDate.getUTCMonth() == month) {
    if (tempDate.getUTCDay() == 0) {
      sundays++;
    }
    tempDate = new Date(tempDate.getTime() - 24 * 60 * 60 * 1000);
  }
  return sundays;
}

Date.prototype.toDateString = function() {
  return   this.getUTCFullYear() + "-"
         + pad(this.getUTCMonth()+1) + "-"
         + pad(this.getUTCDate()) + " "
         + pad(this.getUTCHours()) + ":"
         + pad(this.getUTCMinutes()) + ":"
         + pad(this.getUTCSeconds());
}
