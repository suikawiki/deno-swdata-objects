import opentype from "./opentype.module.js";

const ALLOWED_ORIGINS = new Set([
  "https://fonts.suikawiki.org",
]);


Deno.serve (async (req) => {
  try {
    const url = new URL (req.url);
    const parts = url.pathname.split ("/");
    parts.shift ();

    if (parts.length === 0) {
      return new Response ('<!DOCTYPE HTML><title>SuikaWiki</title><a href=https://suikawiki.org>SuikaWiki</a>', {status: 200, headers: {
        'content-type': 'text/html',
      }});
    } else if (parts.length === 1 && parts[0] === 'robots.txt') {
      return new Response ("", {status: 200});
    } else if (parts.length === 1 && parts[0] === 'favicon.ico') {
      return new Response ("", {status: 302, headers: {
        location: 'https://data.suikawiki.org/favicon.ico',
      }});
    }

    // /ot/{url}/...
    if (parts[0] !== "ot" || parts.length < 5) {
      return new Response("Not Found", { status: 404 });
    }

    const encodedFontUrl = parts[1];
    const type = parts[2]; // id | name | char
    const encodedValue = parts[3];
    const tail = parts[4];

    if (tail !== "glyph.svg") {
      return new Response("Not Found", { status: 404 });
    }

    const fontUrl = decodeURIComponent(encodedFontUrl);
    const value = decodeURIComponent(encodedValue);

    const fontURLObj = new URL(fontUrl);
    if (!ALLOWED_ORIGINS.has(fontURLObj.origin)) {
      return new Response("Not Found", { status: 404 });
    }

    const fontRes = await fetch(fontUrl);
    if (!fontRes.ok) {
      return new Response(fontRes.status + " " + fontRes.statusText, { status: fontRes.status });
    }

    const fontBuf = await fontRes.arrayBuffer ();
    const otf = opentype.parse (fontBuf);
    
    let glyph;
    try {
      if (type === "id") {
        glyph = otf.glyphs.get (Number (value));
      } else if (type === "name") {
        let glyphId = otf.glyphNames.names.indexOf (value); // or -1
        if (glyphId !== -1) glyph = otf.glyphs.get (glyphId);
      } else if (type === "char") {
        const codePoint = parseInt (value, 16);
        glyph = otf.charToGlyph (String.fromCodePoint (codePoint));
      } else {
        return new Response("Not Found", { status: 404 });
      }
    } catch (e) {
      console.error (e);
    }
    if (!glyph) return new Response ("404 Glyph not found", { status: 404 });

    const upem = otf.unitsPerEm;
    let h = otf.tables.os2.sTypoAscender - otf.tables.os2.sTypoDescender;
    if (h < upem) h = upem;

    const path = glyph.getPath (0, h + otf.tables.os2.sTypoDescender, upem);
    const pathData = path.toPathData ();

    let license = [
      '<' + fontUrl + '>',
      glyph.glyphID,
      
      otf.names.copyright?.en,
      otf.names.license?.en,
      otf.names.licenseURL?.en,
      otf.names.trademark?.en,
    ].filter (_ => _ != null).join ("\n\n")
        .replace (/&/g, '&amp;').replace (/</g, '&lt;');

    const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${upem} ${upem}"><path d="${pathData}"/><desc>${license}</desc></svg>`;
    return new Response(svg, {
      headers: {
        "content-type": "image/svg+xml; charset=utf-8",
        "cache-control": "public, max-age=" + 10*24*60*60,
      },
    });
  } catch (err) {
    console.error (err);
    return new Response("Internal Server Error", { status: 500 });
  }
});


/*

Copyright 2026 Wakaba <wakaba@suikawiki.org>.

This program is free software: you can redistribute it and/or modify
it under the terms of the GNU Affero General Public License as
published by the Free Software Foundation, either version 3 of the
License, or (at your option) any later version.

This program is distributed in the hope that it will be useful, but
WITHOUT ANY WARRANTY; without even the implied warranty of
MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the GNU
Affero General Public License for more details.

You should have received a copy of the GNU Affero General Public
License along with this program.  If not, see
<https://www.gnu.org/licenses/>.

*/
