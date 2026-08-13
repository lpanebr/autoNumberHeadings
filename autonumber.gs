/**
 * @OnlyCurrentDoc
 *
 * The above comment directs Apps Script to limit the scope of file
 * access for this add-on. It specifies that this add-on will only
 * attempt to read or modify the files in which the add-on is used,
 * and not all of the user's files. The authorization request message
 * presented to users will reflect this limited scope.
 */

/**
 * 
 * ////////////////////////////////////////////////////////////////////////////
 *                            AddOn UI Functions
 * ////////////////////////////////////////////////////////////////////////////
 */

/**
 * Creates a menu entry in the Google Docs UI when the document is opened.
 * This method is only used by the regular add-on, and is never called by
 * the mobile add-on version.
 *
 * @param {object} e The event parameter for a simple onOpen trigger. To
 *     determine which authorization mode (ScriptApp.AuthMode) the trigger is
 *     running in, inspect e.authMode.
 */
function onOpen(e) {
  DocumentApp.getUi().createAddonMenu()
    .addItem('Open sidebar', 'showSidebar')
    .addSeparator()
    .addItem('Refresh Headings', 'numberHeadingsAdd')
    .addItem('Remove Heading Numbers', 'numberHeadingsRemove')
    .addSeparator()
    .addItem('Promote Headings (H1➙Title ... H6➙H5)', 'increaseHeadingLevels')
    .addItem('Demote Headings (Title➙Title, H1➙H2 ... H6➙Normal)', 'decreaseHeadingLevels')
    .addToUi();

  DocumentApp.getUi().createMenu('Heading Tools')
    .addItem('Open sidebar', 'showSidebar')
    .addSeparator()
    .addItem('Refresh Headings', 'numberHeadingsAdd')
    .addItem('Remove Heading Numbers', 'numberHeadingsRemove')
    .addSeparator()
    .addItem('Promote Headings (H1➙Title ... H6➙H5)', 'increaseHeadingLevels')
    .addItem('Demote Headings (Title➙Title, H1➙H2 ... H6➙Normal)', 'decreaseHeadingLevels')
    .addToUi();

}

/**
 * Runs when the add-on is installed.
 * This method is only used by the regular add-on, and is never called by
 * the mobile add-on version.
 *
 * @param {object} e The event parameter for a simple onInstall trigger. To
 *     determine which authorization mode (ScriptApp.AuthMode) the trigger is
 *     running in, inspect e.authMode. (In practice, onInstall triggers always
 *     run in AuthMode.FULL, but onOpen triggers may be AuthMode.LIMITED or
 *     AuthMode.NONE.)
 */
function onInstall(e) {
  onOpen(e);
}

/**
 * Opens a sidebar in the document containing the add-on's user interface.
 * This method is only used by the regular add-on, and is never called by
 * the mobile add-on version.
 */
function showSidebar() {
  const ui = HtmlService.createHtmlOutputFromFile('sidebar')
    .setTitle('Auto number headings');
  DocumentApp.getUi().showSidebar(ui);
}

/**
 * 
 * ////////////////////////////////////////////////////////////////////////////
 *                            AddOn Functions
 * ////////////////////////////////////////////////////////////////////////////
 */

/**
 * Requests that heading's are added/refreshed
 * Intended for menu to call
 */
function numberHeadingsAdd() {
  let up = getPreferences();
  if (up.anyHeadings === null) {
    // Assume that if anyHeadings is missing, then there are no preferences
    numberHeadings(true, false, '', false, null, false);
  } else {
    numberHeadings(true, (up.skipHeadings.toLowerCase() === "true"), up.skippedLevels, (up.titlesRestartNumbering.toLowerCase() === "true"), up.styleData, (up.anyHeadings.toLowerCase() === "true"));
  }
}

/**
 * Requests that heading's are removed
 * Intended for menu to call
 */
function numberHeadingsRemove() {
  let up = getPreferences();
  if (up.anyHeadings === null) {
    // Assume that if anyHeadings is missing, then there are no preferences
    numberHeadings(false, false, '', false, null, false);
  } else {
    numberHeadings(false, (up.skipHeadings.toLowerCase() === "true"), up.skippedLevels, (up.titlesRestartNumbering.toLowerCase() === "true"), up.styleData, (up.anyHeadings.toLowerCase() === "true"));
  }
}

/**
 * Requests that heading levels are increased
 * Intended for menu to call
 */
function increaseHeadingLevels() {
  changeHeadingLevels("up")
}

/**
 * Requests that heading levels are decreased
 * Intended for menu to call
 */
function decreaseHeadingLevels() {
  changeHeadingLevels("down")
}


/**
 * Gets the user options and calls the required function to process headings
 *
 * @param {string} action The single word description of the action to perform.
 * @param {boolean} skipHeadings Whether to process all or only on some levels.
 * @param {string} skippedLevels The levels to skip as a comma separated list.
 * @param {boolean} titlesRestartNumbering Whether a Title will reset numbering.
 * @param {object} styleData JSON object with the styling information
 * @param {boolean} anyHeadings Whether to only process Headings starting with # or the defined pattern
 * @return {Object} Not implemented: Object containing the resulting text and the result of the
 *     operation (success or error).
 */
function processHeadings(action, skipHeadings, skippedLevels, titlesRestartNumbering, styleData, anyHeadings) {
  let result
  switch (action) {
    case 'promote':
      // 
      result = changeHeadingLevels("up", skipHeadings, skippedLevels);
      break

    case 'demote':
      // 
      result = changeHeadingLevels("down", skipHeadings, skippedLevels);
      break

    case 'remove':
      // 
      result = numberHeadings(false, skipHeadings, skippedLevels, titlesRestartNumbering, styleData, anyHeadings);
      break

    case 'save':
      if (skipHeadings) {
        if (skippedLevels.match(/^[1-6,; e and y-]+$/) == null) {
          Logger.log(`skippedLevels is in the wrong format.  Received ${skippedLevels}`);
          throw new Error("skippedLevels is in the wrong format.");
        }
        skippedLevels = skippedLevels.replace(/\D/g, '')
      }

      PropertiesService.getDocumentProperties()
        .setProperty('action', action)
        .setProperty('skipHeadings', skipHeadings)
        .setProperty('skippedLevels', skippedLevels)
        .setProperty('titlesRestartNumbering', titlesRestartNumbering)
        .setProperty('styleData', JSON.stringify(styleData))
        .setProperty('anyHeadings', anyHeadings);

      result = {
        before: "",
        after: ""
      }

      break

    default:
      //
      result = numberHeadings(true, skipHeadings, skippedLevels, titlesRestartNumbering, styleData, anyHeadings);
      break
  }
  // const text = getSelectedText().join('\n');
  return result;
}


/**
 * Applies or removes numbers from headings in the document.
 *
 * @param {boolean} add Set to true to refresh the numbers on headings, false to remove the numbers and replace with #
 * @param {boolean} skipHeadings Whether to process all or only on some levels.
 * @param {string} skippedLevels The levels to skip as a comma separated list.
 * @param {boolean} titlesRestartNumbering Whether a Title will reset numbering.
 * @param {object} styleData JSON object with the styling information
 * @param {boolean} anyHeadings Whether to only process Headings starting with # or the defined pattern
 * @return {Object} Object containing the before and after headings as a result of the operation.
 */
function numberHeadings(add = false, skipHeadings = false, skippedLevels, titlesRestartNumbering, styleData, anyHeadings) {
  const document = DocumentApp.getActiveDocument();
  const selection = DocumentApp.getActiveDocument().getSelection();
  const paragraphs = (selection) ? selection.getRangeElements().map(re => (re.isPartial() || re.getElement().getType() != DocumentApp.ElementType.PARAGRAPH) ? null : re.getElement().asParagraph()) : document.getParagraphs();
  var numbers = [0, 0, 0, 0, 0, 0, 0];
  var appendix = false;
  var headingsToProcessRegex = /HEADING\d/
  var before = []
  var after = []

  if (skipHeadings) {
    headingsToProcessRegex = eval('/HEADING[' + skippedLevels + ']/')
  }

  if (styleData === null) {
    styleData = {
      h1style: "number",
      h1breaker: "running-dot",
      h2style: "number",
      h2breaker: "running-dot",
      h3style: "number",
      h3breaker: "running-dot",
      h4style: "number",
      h4breaker: "running-dot",
      h5style: "number",
      h5breaker: "running-dot",
      h6style: "number",
      h6breaker: "running-dot",
      hseparator: "space",
      appendix: false,
      appendixPrefix: "Appendix "
    }
  }

  if (styleData.h1breaker == "running-dot") {
    styleData.h1style = "number";
    styleData.h2style = "number";
    styleData.h2breaker = "running-dot";
    styleData.h3style = "number";
    styleData.h3breaker = "running-dot";
    styleData.h4style = "number";
    styleData.h4breaker = "running-dot";
    styleData.h5style = "number";
    styleData.h5breaker = "running-dot";
    styleData.h6style = "number";
    styleData.h6breaker = "running-dot";
  }
  let ultimateRegex = getRegexStringFromStyle(styleData);

  if (styleData.appendix && styleData.appendixPrefix.length == 0) {
    styleData.appendixPrefix = "Appendix ";
  }
  const appendixPrefix = styleData.appendixPrefix;
  const allPostfix = getSeparator(styleData);

  const appendixFind = new RegExp(`^${appendixPrefix}# `);
  const appendixHeadingFind = new RegExp(`^(${appendixPrefix}# |# )`);
  const appendixFindText = `^${appendixPrefix}[A-Z]+${allPostfix}`;
  const appendixFindHash = `^${appendixPrefix}# `;
  const appendixReplaceHash = `${appendixPrefix}# `;

  var headingMatch = "^";


  for (let i in paragraphs) {
    let element = paragraphs[i];
    if (element === null) {
      continue;
    }
    let text = element.getText() + '';
    let type = element.getHeading() + '';

    if (type === 'TITLE' && titlesRestartNumbering) {
      numbers = [0, 0, 0, 0, 0, 0, 0];
    }

    // exclude everything but headings
    if (!type.match(headingsToProcessRegex)) {
      continue;
    }

    // exclude empty headings (e.g. page breaks generate these)
    if (text.match(/^\s*$/)) {
      continue;
    }

    before.push(element.getText())
    // If I am a Heading, replace the number/letter with the placemarker #
    element.replaceText(ultimateRegex, "# ")
    if (styleData.appendix) {
      element.replaceText(appendixFindText, appendixReplaceHash)
      text = element.getText() + '';
      if (anyHeadings && !(text.startsWith(appendixReplaceHash) || text.startsWith("# "))) {
        element.editAsText().insertText(0, '# ');
      }
    } else {
      text = element.getText() + '';
      if (anyHeadings && !text.startsWith("# ")) {
        element.editAsText().insertText(0, '# ');
      }
    }

    // Remove the # from headings (except Appendicies) if remove and anyHeadings
    if (!add && anyHeadings) {
      element.replaceText("^# ", "");
    }

    text = element.getText() + '';

    if (add == true && text.match(appendixHeadingFind)) {
      let level = new RegExp(/HEADING(\d)/).exec(type)[1];
      let numbering = '';

      if (styleData.appendix) {
        // Reset numbering if we are the 1st Appendix (only level 1), or the 1st level 1 that isn't an appendix.
        if (level == 1 && text.match(appendixFind) && appendix == false) {
          appendix = true;
          numbers = [0, 0, 0, 0, 0, 0, 0];
        } else if (level == 1 && text.match(appendixFind) == false && appendix == true) {
          appendix = false;
          numbers = [0, 0, 0, 0, 0, 0, 0];
        }
      }

      numbers[level]++;
      for (let currentLevel = 1; currentLevel <= 6; currentLevel++) {
        if (appendix && currentLevel == 1 && level == currentLevel) {
          numbering += convertToAlpha(numbers[currentLevel], true);
        } else {
          if (currentLevel <= level) {
            if ((appendix && currentLevel > 1) || !appendix) {
              numbering += generateHeadingNumber(numbers[currentLevel], styleData, currentLevel);
            }
          } else {
            numbers[currentLevel] = 0;
          }
        }
      }
      if (appendix && level == 1) {
        element.replaceText(appendixFindHash, appendixPrefix + numbering + allPostfix)
      } else {
        element.replaceText("^# ", numbering + allPostfix)
      }
    }
    after.push(element.getText())
  }

  return {
    before: before.join("\n"),
    after: after.join("\n")
  }
}

/**
 * Changes the level of a heading up or down
 *
 * @param {string} direction 'up' to increase the level of all headings, 'down'
 * @param {boolean} skipHeadings Whether to process all or only on some levels.
 * @param {string} skippedLevels The levels to skip as a comma separated list.
 * @return {Object} Object containing the before and after headings as a result of the operation.
 */
function changeHeadingLevels(direction = '', skipHeadings = false, skippedLevels) {
  let document = DocumentApp.getActiveDocument()
  let body = document.getBody()
  const selection = DocumentApp.getActiveDocument().getSelection();
  const paragraphs = (selection) ? selection.getRangeElements().map(re => (re.isPartial() || re.getElement().getType() != DocumentApp.ElementType.PARAGRAPH) ? null : re.getElement().asParagraph()) : document.getParagraphs();

  let headingsToProcessRegex = /HEADING\d/
  let before = []
  let after = []

  if (skipHeadings) {
    headingsToProcessRegex = eval('/HEADING[' + skippedLevels + ']/')
  }

  let inserted_paragraph
  for (let i in paragraphs) {
    let current_paragraph = paragraphs[i];
    if (current_paragraph === null) {
      continue;
    }
    let text = current_paragraph.getText() + '';
    let type = current_paragraph.getHeading() + '';

    // exclude everything but headings
    if (!type.match(headingsToProcessRegex)) {
      continue;
    }

    // exclude empty headings (e.g. page breaks generate these)
    if (text.match(/^\s*$/)) {
      continue;
    }

    before.push(current_paragraph.getText())

    // as integer
    let currentLevel = new RegExp(/HEADING(\d)/).exec(type)[1] * 1;

    let problemCurrentLevel = 6
    let newLevel = currentLevel + 1
    let problemLevelFix = "NORMAL"

    if (direction == "up") {
      problemCurrentLevel = 1
      newLevel = currentLevel - 1
      problemLevelFix = "TITLE"
    }

    let newHeadingLevel = eval("DocumentApp.ParagraphHeading.HEADING" + newLevel)
    if (currentLevel == problemCurrentLevel) {
      newHeadingLevel = eval("DocumentApp.ParagraphHeading." + problemLevelFix)
    }
    let style = {};
    style[DocumentApp.Attribute.HEADING] = newHeadingLevel

    let curr_para_id = body.getChildIndex(current_paragraph)
    let new_paragraph = current_paragraph.copy().setText(" ")
    inserted_paragraph = body.insertParagraph(curr_para_id + 1, new_paragraph).setAttributes(style).merge()

    // current_paragraph.setAttributes(style)
    after.push(inserted_paragraph.getText())
  }

  return {
    before: before.join("\n"),
    after: after.join("\n")
  }
}

/**
 * Gets the stored user preferences for the origin and destination languages,
 * if they exist.
 * This method is only used by the regular add-on, and is never called by
 * the mobile add-on version.
 *
 * @return {Object} The user's origin and destination language preferences, if
 *     they exist.
 */
function getPreferences() {
  const userProperties = PropertiesService.getDocumentProperties();
  if (userProperties.getProperty('anyHeadings') == null) {
    return { 
      action: "save",
      styleData: {
        h1style: "number",
        h1breaker: "running-dot",
        h2style: "number",
        h2breaker: "running-dot",
        h3style: "number",
        h3breaker: "running-dot",
        h4style: "number",
        h4breaker: "running-dot",
        h5style: "number",
        h5breaker: "running-dot",
        h6style: "number",
        h6breaker: "running-dot",
        hseparator: "space",
        appendix: false,
        appendixPrefix: "Appendix "
      },
      anyHeadings: "true", // This is a string as that is what the getProperty would return
      titlesRestartNumbering: "false",
      skipHeadings: "false",
      skippedLevels: ""
    }
  } else {
    return {
      action: userProperties.getProperty('action'),
      styleData: JSON.parse(userProperties.getProperty('styleData')),
      anyHeadings: userProperties.getProperty('anyHeadings'),
      titlesRestartNumbering: userProperties.getProperty('titlesRestartNumbering'),
      skipHeadings: userProperties.getProperty('skipHeadings'),
      skippedLevels: userProperties.getProperty('skippedLevels')
    };
  }
}

/**
 * Converts the supplied number into Roman Numerals.
 * There is no Zero in Roman Numerals!
 *
 * @param  {number} num The number to convert into Roman Numerals
 * @param  {boolean} uppercase Whether the result is to be in upper case
 * @return {string} The resultant Roman Numberal
 **/
function convertToRoman(num, uppercase = false) {
  const lookup = {
    M: 1000, CM: 900, D: 500, CD: 400,
    C: 100, XC: 90, L: 50, XL: 40,
    X: 10, IX: 9, V: 5, IV: 4, I: 1
  };
  let roman = '';
  for (let i in lookup) {
    while (num >= lookup[i]) {
      roman += i;
      num -= lookup[i];
    }
  }
  return uppercase ? roman : roman.toLowerCase();
}

/**
 * Converts the supplied number into a-z (or A-Z if uppercase is true).
 * On reaching 27 it goes to aa, 53 it goes to aaa, etc.
 *
 * @param  {number} num The number to convert into Alphas
 * @param  {boolean} uppercase Whether the result is to be in upper case
 * @return {string} The resultant Alphas
 **/
function convertToAlpha(num, uppercase = false) {
  const validchars = 'abcdefghijklmnopqrstuvwxyz';
  num = Math.abs(num);
  var remainder = num % 26;
  num = Math.floor(num / 26);
  if (remainder == 0 && num > 0) {
    remainder = 26;
    num--;
  }
  let char = validchars.substring(remainder - 1, remainder);
  return uppercase ? char.repeat(num + 1).toUpperCase() : char.repeat(num + 1);
}

/**
 * Returns the "number" based on the level style and level breaker
 *
 * @param {number} num The number to render
 * @param {object} style styleData from the preferences
 * @param {number} level The heading level that the number is to be rendered for
 * @return {string} The character that is the heading separator
 **/
function generateHeadingNumber(num, style, level) {
  switch (level) {
    case 1:
      return generateNumber(num, style.h1style, style.h1breaker);
    case 2:
      return generateNumber(num, style.h2style, style.h2breaker);
    case 3:
      return generateNumber(num, style.h3style, style.h3breaker);
    case 4:
      return generateNumber(num, style.h4style, style.h4breaker);
    case 5:
      return generateNumber(num, style.h5style, style.h5breaker);
    case 6:
      return generateNumber(num, style.h6style, style.h6breaker);
  }
}

/**
 * Returns the "number" based on the level style and level breaker
 *
 * @param {number} num The number to render
 * @param {levelstyle} string The identifier of the style for the level being rendered
 * @param {levelbreaker} string The identifier of the breaker for the level being rendered
 * @return {string} The string that the number and breaker was rendered into
 **/
function generateNumber(num, levelstyle, levelbreaker) {
  var result = "";

  if (levelbreaker == "open-close-bracket") {
    result += "(";
  }

  switch (levelstyle) {
    case "number":
    case "d-number":
      result += num;
      break;
    case "l-alpha":
      result += convertToAlpha(num, false);
      break
    case "u-alpha":
      result += convertToAlpha(num, true);
      break
    case "l-roman":
      result += convertToRoman(num, false);
      break
    case "u-roman":
      result += convertToRoman(num, true);
      break
  }
  switch (levelbreaker) {
    case "dot":
    case "running-dot":
      result += ".";
      break;
    case "close-bracket":
      result += ")";
      break;
    case "open-close-bracket":
      result += ")";
      break;
    case "dash":
      result += "-";
      break;
    case "colon":
      result += ":";
      break;
    case "semicolon":
      result += ";";
      break;
  }
  return result;
}

/**
 * Returns the actual separator character from the style object
 *
 * @param {object} style  styleData from the preferences
 * @return {string} The character that is the heading separator
 **/
function getSeparator(style) {
  switch (style.hseparator) {
    case "space":
      return " ";
    case "tab":
      return "\t";
    case "dash":
      return "-";
    case "colon":
      return ":";
    case "semicolon":
      return ";";
    default:
      return " ";
  }
}

/**
 * Returns the regular expression that selects any numbers supported, with the configured trailing separator
 *
 * @param {object} style  styleData from the preferences
 * @return {string} The regular expression
 **/
function getRegexStringFromStyle(style) {
  return "^\\(?(([0-9]+)|([a-z]+)|([A-Z]+))(([\\)\\.\\-:;])\\(?(([0-9]+)|([a-z]+)|([A-Z]+)))*([\\)\\.\\-:;])" + getSeparator(style);
}
