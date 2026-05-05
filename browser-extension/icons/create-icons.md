# Extension Icons

The extension requires two icon files:
- `icon-48.png` (48x48 pixels)
- `icon-96.png` (96x96 pixels)

## Creating Icons

You can create simple icons using any image editor or online tool:

1. **Online Icon Generator**: Use a tool like https://www.favicon-generator.org/
2. **Design Tool**: Use Figma, Canva, or Photoshop
3. **Simple SVG to PNG**: Create an SVG and convert to PNG

## Suggested Icon Design

Create a simple icon with:
- Background: Blue (#0f62fe)
- Symbol: White accessibility symbol (♿) or magnifying glass (🔍)
- Text: "A11y" in white

## Quick Solution

For testing, you can use any 48x48 and 96x96 PNG images. Just name them:
- `icon-48.png`
- `icon-96.png`

And place them in this directory.

## Using ImageMagick (if installed)

```bash
# Create a simple blue square with text
convert -size 48x48 xc:#0f62fe -pointsize 20 -fill white -gravity center -annotate +0+0 "A11y" icon-48.png
convert -size 96x96 xc:#0f62fe -pointsize 40 -fill white -gravity center -annotate +0+0 "A11y" icon-96.png