# CngxTabSubLabel

The slot renders a secondary line under the primary tab label (a count, a short detail). It is part of the tab's name, not a separate control.

- **It folds into the accessible name.** The sub-label is spoken as part of the tab's name, so AT hears "Bookmarks, 45 saved". Keep it short and meaningful - it is read on every tab announcement, not decorative filler.
- **It is not a focus stop.** The sub-label is presentational text inside the tab button; it adds no tab stop and no interactive element.
- **Mind redundancy.** Since it joins the spoken name, avoid repeating what the primary label already says - the SR reads both back to back.
