<aside role="note" aria-label="Page metadata" class="cdx-ai-generated-note">
    <span class="cdx-badge cdx-badge--ai-generated">AI-assisted</span>
    <span>Drafted with Claude, reviewed by the maintainers.</span>
</aside>

# Choosing a Trigger

<aside class="cc-tldr">

"Dropdown" is not one widget. A button that runs a command, a button that opens a menu of commands, a control that picks a value, and a button that shows or hides a block of content are four different ARIA patterns, and a screen reader announces each of them differently. Pick the pattern by what the user is doing, not by what the closed control looks like: run something, choose a value, or reveal content. CNGX ships one piece per pattern, so the choice is also the import.

</aside>

This page maps each intent to its pattern and its CNGX piece, then lists the questions that decide between them. Every row links to a running example.

---

## The nine patterns

|Intent|Pattern|What assistive technology hears|CNGX piece|Example|
|-|-|-|-|-|
|Run one command|Action button|button|`cngxButton`; `cngxAsyncClick` or `cngxActionButton` when the command is async|[Variants](https://cngxjs.github.io/cngx/examples/#/common/button/button/variants), [Async button](https://cngxjs.github.io/cngx/examples/#/ui/action-button/async-button/random-outcome)|
|Run one command, no room for a label|Icon button|button with a name from `aria-label`|`cngxIconButton`|[Icon button](https://cngxjs.github.io/cngx/examples/#/common/button/icon-button/basic)|
|Pick one of several commands|Menu button|button, menu popup, collapsed / expanded; then a `menu` of `menuitem`s|`cngxMenuButton` with a `cngxMenu` in a `cngxPopover`|[Menu button](https://cngxjs.github.io/cngx/examples/#/common/menu-button/menu-button/basic)|
|Pick one of several commands, no room for a label|Icon menu button|the same as a menu button, name from `aria-label`|`cngxIconMenuButton`|[Kebab menu](https://cngxjs.github.io/cngx/examples/#/common/menu-button/icon-menu-button/kebab)|
|Run the usual command, or pick a variant of it|Split button|a group of a button and a menu button|`cngxSplitButton` around a `cngxButton` and a `cngxIconMenuButton`|[Split button](https://cngxjs.github.io/cngx/examples/#/common/menu-button/split-button/basic)|
|Choose a value that stays chosen|Select|combobox with a listbox popup, announcing the current value|`<cngx-select>` and the rest of the select family|[Select](https://cngxjs.github.io/cngx/examples/#/forms/select/single-select/clearable)|
|Show or hide content in place|Inline disclosure|button, collapsed / expanded|`cngxDisclosure`|[Disclosure](https://cngxjs.github.io/cngx/examples/#/common/interactive/disclosure/basic-uncontrolled)|
|Show or hide content that floats over the page|Popover disclosure|button, collapsed / expanded, no popup type|`cngxButton` with `cngxPopoverTrigger` and `haspopup="none"`|[Link list](https://cngxjs.github.io/cngx/examples/#/common/popover/disclosure/link-list)|
|Switch between a few always-visible options|Toggle group|radio group of radio buttons (single) or toolbar of pressed buttons (multi)|`<cngx-button-toggle-group>`, `<cngx-button-multi-toggle-group>`|[View switcher](https://cngxjs.github.io/cngx/examples/#/common/interactive/button-toggle/group/basic-view-switcher)|

---

## The questions

Ask them in this order. The first "yes" is your pattern.

1. **Does the control's label show the choice afterwards?** "Sort: Newest", "Country: Austria". Then the user is choosing a value, not running a command: use a **select**. A menu forgets what was picked the moment it closes.
2. **Are there two to five options, and should all of them stay visible?** List, grid, board. Use a **toggle group**: the current option is visible without opening anything, and one click switches.
3. **Does something happen at once when the user picks an entry?** Export as PDF, duplicate, archive. Use a **menu button**. If one of those commands is what the user wants most of the time, use a **split button** (see below).
4. **Are the entries links, or mixed content such as a short form, a help text or a list of recent files?** Use a **disclosure**. Links stay plain links in a list, reached with Tab; a menu would announce them as commands and change how the arrow keys work.
5. **Must the revealed content push the layout down?** FAQ answers, a "show details" block, a navigation group in a side bar. Use the **inline disclosure** (`cngxDisclosure`). If the content should float over the page and leave the layout alone, use the **popover disclosure**.
6. **Only one command?** An **action button**, or an **icon button** when space is tight and the glyph is well known.

---

## Split button or menu button

A split button earns its seam when one command is the default and the menu holds variants of it: "Save" with "Save as draft" and "Save a copy", "Merge" with "Squash and merge". The main part runs the default in one click; the caret opens the alternatives.

- Use a **menu button** when no command dominates. A split button whose main part is a guess makes every user read the menu anyway, and adds a second tab stop for nothing.
- The two parts are two buttons. Each one needs to make sense alone: the main button carries a verb ("Save"), the caret is named for what it opens. CNGX names the caret "More options" by default inside a split button.
- While the main command runs, the caret is blocked too, and an open menu closes. A user cannot start a variant of a command that is already in flight.
- Keep the menu entries close to the main command. A split button is not a place to collect unrelated actions.

## Toggle group or menu

A toggle group keeps its options on screen and shows the current one. That is right for a state that stays (view mode, text alignment, a filter) and wrong for a command that runs once. Reach for a menu when there are more than about five options, when the options are commands, or when the space is not there.

## Icon-only triggers need a name

An icon button, an icon menu button and a close button have no visible text, so the name has to come from somewhere else.

- Put `aria-label` on the host, written as what the button does: "Delete row", "More actions for Invoice 42". Not the glyph ("Trash", "Three dots").
- A tooltip describes; it does not name. `cngxTooltip` adds a description, the button still needs its own label.
- A nameless icon button, icon menu button or close button warns `CNGX1071` in development. Inside a split button the caret takes its default name from the menu-button copy, so it needs no label of its own.
- Reuse the same name for the same action across the app. A screen-reader user who learned "More actions" in one table expects it in the next.

---

## Anti-patterns

|Don't|Why|Do instead|
|-|-|-|
|Navigation links in a `role="menu"`|The menu promises commands and arrow-key navigation; screen readers announce the entries as menu items instead of links|A popover disclosure with a list of links|
|A select whose options trigger actions|A select announces a value; the user expects the choice to stay, not something to happen|A menu button|
|A menu button whose label shows the last picked value|The label now pretends to be a value, but the menu does not remember it and assistive technology hears a command|A select, or a split button with a fixed verb|
|A disclosure with `aria-haspopup="menu"`|Screen readers announce a menu that is not there|`haspopup="none"` on the popover trigger, as in the link-list example|
|An icon button without a name|Assistive technology announces "button" and nothing else|`aria-label` that names the action|
|A split button with unrelated actions behind the caret|The caret reads as "more of the same"; unrelated entries get missed|A separate menu button|

---

## Further reading

- [WAI-ARIA APG: Menu Button Pattern](https://www.w3.org/WAI/ARIA/apg/patterns/menu-button/)
- [WAI-ARIA APG: Disclosure Pattern](https://www.w3.org/WAI/ARIA/apg/patterns/disclosure/)
- [WAI-ARIA APG: Combobox Pattern](https://www.w3.org/WAI/ARIA/apg/patterns/combobox/)
- [Forms & Inputs](forms-&-inputs.html) - where a select sits inside a form field.
- [The Three Pillars](the-three-pillars.html) - why every state change in these triggers is announced.
