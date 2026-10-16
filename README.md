# Amritanshu Kumar Shandilya — portfolio

Plain HTML, CSS and JavaScript. No build step. Open `index.html` in a browser and it works.

## Files

```
index.html        Home: headline + pixel portrait, work list, how I work, contact
ode.html          Case study
desportivos.html  Case study
vignette.html     Case study
posters.html      All posters
404.html          "Page not found" (Vercel uses it automatically)
css/style.css     The only stylesheet. Colours and fonts are at the top.
js/main.js        Lightbox, fade-in on scroll, pixel portrait, Red the messenger owl
images/           All artwork (WebP)
files/            Portfolio PDF
```

## Add a project
1. Put images in `images/` (WebP, longest edge ~1600px).
2. Copy `vignette.html` to `new-project.html` and edit the text and image paths.
3. In `index.html`, copy one `<a class="work">` block inside the Work section and change the link, image and text.

## Add a poster
In `posters.html`, copy one `<button class="frame">` line and change the file name.

## Change the look
Edit the `:root` block at the top of `css/style.css`.
