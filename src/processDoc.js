var emoji = require('node-emoji')

const AVATAR_CLASS = '.c-avatar'
const NEW_MESSAGES_DIVIDER_CLASS = '.c-message_list__unread_divider'
const ATTACHMENTS_CLASS = '.c-message_kit__attachments' // how is this different from attached files?
const CUSTOM_STATUS_EMOJI_CLASS = '.c-custom_status'
const ATTACHED_FILES_CONTAINER_CLASS = '.p-message_gallery_image_file'
const MESSAGE_CLASS = '.c-virtual_list__item'
const TIMESTAMP_LABEL_CLASS = '.c-timestamp__label'
const TOP_THREE_EMOJIS_CLASS = '.c-message__actions'
const ADD_REACTION_CLASS = '.c-reaction_add'

const SVG_ELEMENT = 'svg'
const IMG_ELEMENT = 'img'
const DIV_ELEMENT = 'div'
const PARAGRAPH_ELEMENT = 'p'
const LI_ELEMENT = 'li'

// By default, slack provides an image src that is the thumbnail
// version, aka lower resolution. This replaces that with the
// fullsize image. 
const increaseResolution = (image) => {
  var formatted = image.replace('files-tmb', 'files-pri') // thumbnail vs fullsize i think
  formatted = formatted.replace('_720.png', '.png')
  return formatted
}

const processDoc = (doc) => {
    var attachmentsDetected = 0;

    /// REPLACES EMOJIs with text about what the emoji is
    //     i.e. the potato emoji becomes ":potato:"
    //
    // Custom emoji beyond the basics can be added per the docs: https://www.npmjs.com/package/node-emoji
    doc.querySelectorAll('[data-stringify-emoji]').forEach(e => {
      var emojiText = document.createElement("span");
      var shortcode = e.getAttribute('data-stringify-emoji') + " ";
      emojiText.innerHTML = emoji.emojify(`${shortcode}`) + " ";
      e.parentNode.replaceChild(emojiText, e)
    });

    // Replace linebreaks marked by class
    doc.querySelectorAll('.c-mrkdwn__br').forEach(e => {
      const paragraph = document.createElement(PARAGRAPH_ELEMENT)
      e.parentNode.replaceChild(paragraph, e)
    });

    // Replace linebreaks marked by <br> tag
    doc.querySelectorAll('br').forEach(e => {
      const paragraph = document.createElement(PARAGRAPH_ELEMENT)
      e.parentNode.replaceChild(paragraph, e)
    });

    /// REMOVES AVATARS
    doc.querySelectorAll(AVATAR_CLASS).forEach(e => {
      e.remove();
    });

    /// REMOVES 'new messages' divider
    doc.querySelectorAll(NEW_MESSAGES_DIVIDER_CLASS).forEach(e => {
      e.remove();
    });

    /// REMOVES 'add reaction' button
    doc.querySelectorAll(ADD_REACTION_CLASS).forEach(e => {
      e.remove();
    });

    /// REMOVES 'actions' popup (that shows top 3 emojis; this shows up when you copy a slack thread)
    doc.querySelectorAll(TOP_THREE_EMOJIS_CLASS).forEach(e => {
      e.remove();
    });

     /// REMOVES ATTACHMENTS
    doc.querySelectorAll(ATTACHMENTS_CLASS).forEach(e => {
      e.remove();
    });

    /// REMOVES CUSTOM STATUS EMOJIS
    doc.querySelectorAll(CUSTOM_STATUS_EMOJI_CLASS).forEach(e => {
      e.remove();
    });

    /// REMOVES SVGS
    doc.querySelectorAll(SVG_ELEMENT).forEach(e => {
      e.remove();
    });

    /// REPLACES IMGs with their alt text 
    //   (since we've gotten rid of emojis and avatars,
    ///   this should just be uploaded images)
    //   TODO: instead of deleting, ideally we'd either allow image to show up by fixing CORS blockage, 
    //     or else automatically download the image so it can be easily uploaded to notion
    doc.querySelectorAll(ATTACHED_FILES_CONTAINER_CLASS).forEach(imgContainer => {
      const img = imgContainer.querySelector(IMG_ELEMENT)
      if (img) {
        attachmentsDetected += 1
        console.log(img)
        var imgText = document.createElement(PARAGRAPH_ELEMENT);
        imgText.className = 'missing-img'
        var warning = ''
        for(let i = 0; i < 10; i++) {
          warning += emoji.emojify(`:warning:`)
        }
        imgText.innerHTML = `
            ${warning}
            (you must download <a href="${increaseResolution(img.src)}" target="_blank">${img.getAttribute('alt')}</a> 
            and manually add it to Notion) 
            ${warning}`

          imgContainer.parentNode.replaceChild(imgText, imgContainer)
          imgContainer.remove()
      }
    });

    var foundFirstTimestamp = false;
    for(const elm of doc.querySelectorAll(MESSAGE_CLASS)) {
      // Timestamp manipulation is done to avoid getting timestamps reading
      //   "1 day ago" -- someone looking later at a slack dump will have no idea when
      //   "1 day ago" actually was.
      const timestampLink = elm.querySelector(TIMESTAMP_LABEL_CLASS)
      if (timestampLink) {
        const timestamp = timestampLink?.parentElement.getAttribute('data-ts')
        const humanReadableTimestamp = new Date(timestamp * 1000).toDateString() // i.e. Mon Mar 23 2023
        timestampLink.remove();

        // Apply timestamp only to the first message in the thread
        if (!foundFirstTimestamp) {
          elm.querySelector('.c-message__sender button').innerHTML += ` (${humanReadableTimestamp})`;
          foundFirstTimestamp = true;
        }
      }

      // // TODO: possibly use these to construct <Message /> components in react, passing in the
      // // relevant props
      // console.log(elm.innerHTML);
      // console.log("~~~~~~~~~~~~~~~~~~")
      // const sender = elm.querySelector(".c-message__sender")?.innerText
      // console.log(`sender: ${sender}`);
      // console.log("~~~~~~~~~~~~~~~~~~")

      // console.log("~~~~~~~~~~~~~~~~~~")
      // const msgContent = elm.querySelector(".c-message_kit__blocks")?.innerHTML
      // console.log(`msgContent: ${msgContent}`);
      // console.log("+++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++")
    }

    doc.querySelectorAll(LI_ELEMENT).forEach(e => {
      e.style = 'margin-left: 28px'
    })

    // REMOVES STYLING FROM DIVS
    doc.querySelectorAll(DIV_ELEMENT).forEach(e => {
      e.className = ''
      e.style = {}
      e.style.textAlign = 'left'
    });

    /// REMOVES leftover classes from everything
    doc.querySelectorAll('*').forEach(e => {
      if (e.hasAttribute('className')){
        e.className = "";
      }
    });

    return [doc, attachmentsDetected]
  }

  export {processDoc};