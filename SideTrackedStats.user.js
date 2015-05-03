// ==UserScript==
// @name        SideTrackedStats
// @namespace   http://www.cryotest.com/
// @description Adds your SideTracked stats badge onto your profile page and SideTracked cache pages on geocaching.com.
// @license     GPL version 3 or any later version; http://www.gnu.org/copyleft/gpl.html
// @copyright   2015, Cryo99
// @attribution SideTracked stats provided by Chris AKA Bus.Stop (http://www.sidetrackedseries.info/)
// @attribution Icon image extracted from the SideTracked banner by Chris AKA Bus.Stop
// @icon        https://raw.githubusercontent.com/Cryo99/SideTrackedStats/master/icon48.png
// @icon64      https://raw.githubusercontent.com/Cryo99/SideTrackedStats/master/icon64.png
// @include     /^https?://www\.geocaching\.com/(my|default|geocache|profile|seek/cache_details)/
// @exclude     /^https?://www\.geocaching\.com/(login|about|articles|myfriends)/
// @version     0.0.1
// @grant       GM_xmlhttpRequest
// ==/UserScript==


(function () {
  "use strict";
  var cacheName = document.getElementById("ctl00_ContentBody_CacheName"),
    stsCSS = document.createElement("style"),
    // ST images can be wider when level names are long. overflow: hidden; on sts-container prevents images from overlaying the div border.
    css = 'div.sts-container { border: 1px solid #b0b0b0; margin-top: 1.5em; padding: 0; text-align: center; overflow: hidden;} .WidgetBody div.sts-container { border: none; } #ctl00_ContentBody_ProfilePanel1_pnlProfile div.sts-container { border: none; text-align: inherit;}',
    currentPage,
    profileName = document.getElementById("ctl00_ContentBody_ProfilePanel1_lblMemberName"),
    userField = document.getElementsByClassName("li-user-info"),
    userName = "",
    userNames = [],
    stats = [];

  function displayStats(stats, page) {
    function getHtml(uname, level, award, finds) {
        return "<a class='sts-badge' href='http://www.sidetrackedseries.info' title='SideTracked stats.'><img src='http://img.sidetrackedseries.info/awards/st_F_award.php?name=" + uname + "&brand=jobs' /></a>";
    }
    var stsWidget = document.createElement("div"),
      html = "",
      i,
      images,
      loop,
      target,
      target2;

    for (i = 0; i < stats.length; i++) {
      name = (stats[i].name + "")
        .replace(/;/g, ",")
        .replace(/'/g, "&apos;")
        .replace(/"/g, "&quot;");
      if (i === 0 || stats[i].name !== stats[0].name) {
        html += getHtml(name);
      }
    }

    switch (page) {
    case "my":
      target = document.getElementById("ctl00_ContentBody_lnkProfile");
      break;
    case "cache":
      target = document.getElementById("map_preview_canvas");
      break;
    case "profile":
      // Abort if award badge already on profile page
      images = document.getElementsByTagName("IMG");
      for (loop = 0; loop < images.length; loop++) {
        if (/img.sidetrackedseries.info\/awards\/st_F_award.php/.test(images[loop].src)) {
          console.info("SideTracked badge not inserted: already on profile of " + userName);
          return;
        }
      }
      target = document.getElementById("ctl00_ContentBody_ProfilePanel1_lblProfile");
      if (target) {
        target = target.parentNode;
      }
      break;
    }

    if (!target && !target2) {
      console.warn("SideTracked Stats: Aborted - couldn't find where to insert widget. Might not be logged in.");
      return;
    }

    if (html) {
      stsWidget.className = "sts-container";
      stsWidget.innerHTML = html;
      target.parentNode.insertBefore(stsWidget, target.nextSibling);
    } else {
      console.warn("SideTracked Stats: didn't generate any award badge.");
    }
  }
  function getHiderName() {
    var i,
      links = document.getElementsByTagName("a"),
      pos;
    if (links) {
      for (i = 0; i < links.length; i++) {
        pos = links[i].href.indexOf("/seek/nearest.aspx?u=");
        if (pos !== -1) {
          return decodeURIComponent(links[i].href.substr(pos + 21).replace(/\+/g, '%20'));
        }
      }
    }
  }

  function parseNames(names) {
    // Filter out null or undefined entries, convert commas to semicolons, then convert to a comma-separated string.
    return encodeURIComponent(names
      .filter(function (n) {return n != undefined; })
      .map(function (n) {return (n + "").replace(/,/g, ";"); })
      .join());
  }

  // Don't run on frames or iframes
  if (window.top !== window.self) { return false; }

  if (/\/my\/myfriends\.aspx/.test(location.pathname)) {
    // Your Friends
    currentPage = "friends";
  } else {
    if (/\/my\//.test(location.pathname)) {
      // On a My Profile page
      currentPage = "my";
    } else {
      if (cacheName) {
        // On a Geocache page...
        if (!/SideTracked/i.test(cacheName.innerHTML) && !/side tracked/i.test(cacheName.innerHTML)) {
          // ...but not a SideTracked  cache
          return;
        }
        currentPage = "cache";
      } else {
        currentPage = "profile";
      }
    }
  }

  switch (currentPage) {
  case "profile":
    if (profileName) {
      userNames = [profileName.textContent.trim()];
    }
    break;
  default:
    if (userField.length > 0 && userField[0].children && userField[0].children.length > 0) {
      userNames.push(userField[0].children[0].innerHTML.trim());
    }
    var hider = getHiderName();
    if(typeof hider !== 'undefined'){
      userNames.push(hider);
    }
    break;
  }

  for(var i = 0;i < userNames.length;i++){
    stats[i] = {name: userNames[i]}
  }
  
  userName = parseNames(userNames);
  if (!userName) {
    console.error("SideTracked Stats: Aborted - couldn't work out user name");
    return;
  }

  // Inject widget styling
  stsCSS.type = 'text/css';
  if (stsCSS.styleSheet) {
    stsCSS.styleSheet.cssText = css;
  } else {
    stsCSS.appendChild(document.createTextNode(css));
  }
  document.documentElement.firstChild.appendChild(stsCSS);
  displayStats(stats.reverse(), currentPage);
}());