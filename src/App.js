import React from 'react';
import './App.css';


//styling suggestions:
 // create 2 columns:
// put the pastebox on the lefthand side
// and the stripped output on the righthand side
// this will better follow the slack format

// also, make the paste box much bigger so you can see all/most of the input from the slack thread

// also, make the pasted-in container nice and clean -- less barebones looking
//   and maybe in a nice font or something ??

function App() {
  const [pasted, setPasted] = React.useState('')

  function extractSlackData(pastedMessage) {
    let content = pastedMessage.clipboardData.getData('text/html')
      const doc = new DOMParser().parseFromString(content, 'text/html');
  
      /// REPLACES EMOJIs with text about what the emoji is
      //     i.e. the potato emoji becomes ":potato:"
      doc.querySelectorAll('[data-stringify-emoji]').forEach(e => {
        // console.log(e)
        var emojiText = document.createElement("span");
        emojiText.innerHTML = e.getAttribute('data-stringify-emoji') + " "
        e.parentNode.replaceChild(emojiText, e)
      });
  
      /// REMOVES AVATARS
      doc.querySelectorAll('.c-avatar').forEach(e => {
        e.remove();
      });
  
      /// REMOVES SVGS
      doc.querySelectorAll('svg').forEach(e => {
        e.remove();
      });
  
      /// REPLACES IMGs with their alt text 
      //   (since we've gotten rid of emojis and avatars,
      ///   this should just be uploaded images)
      //   TODO: instead of deleting, ideally we'd either allow image to show up by fixing CORS blockage, 
      //     or else automatically download the image so it can be easily uploaded to notion
      doc.querySelectorAll('.c-files_container').forEach(e => {
        const img = e.querySelector('img')
        var imgText = document.createElement("span");
        imgText.innerHTML = `<<< ${img.getAttribute('alt')} >>>`
        e.parentNode.replaceChild(imgText, e)
      });
  
      /// REMOVES STYLING FROM DIVS
      doc.querySelectorAll('div').forEach(e => {
        e.className = ''
        e.style = {}
        e.style.textAlign = 'left'
      });
  
      let messages = [];
      for(const elm of doc.querySelectorAll(".c-virtual_list__item")) {
        // for a single message:
        //    get sender: class c-message__sender
        //    get timestamp: c-timestamp__label -- sometimes this is 1 day ago, so better to grab this element's parent link and select the aria-label of that link
        //    get content: c-message_kit__blocks
        //    get avatar: c-base_icon
  
        // emoji class: c-emoji
  
  
        // TODO: use these to construct <Message /> components in react, passing in the
        // relevant props
        console.log(elm.innerHTML);
        console.log("~~~~~~~~~~~~~~~~~~")
        const sender = elm.querySelector(".c-message__sender")?.innerText
        console.log(`sender: ${sender}`);
        console.log("~~~~~~~~~~~~~~~~~~")
        const timeSent = elm.querySelector(".c-timestamp__label")?.innerText
        console.log(`timeSent: ${timeSent}`);
        console.log("~~~~~~~~~~~~~~~~~~")
        const msgContent = elm.querySelector(".c-message_kit__blocks")?.innerHTML
        console.log(`msgContent: ${msgContent}`);
        console.log("+++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++")
        const msg = {
          sender: sender,
          timeSent: timeSent,
          contents: msgContent
        }
        messages.push(msg)
      }

      return messages

      // doc.querySelectorAll('*').forEach(e => {
      //   if (e.hasAttribute('className')){
      //     e.className = "";
      //   }
      // });
      // content = new XMLSerializer().serializeToString(doc)
  }

  const handlePaste = (event) => {
    const content = extractSlackData(event)
    setPasted(content)
  }

  const generateMessages = () => {
    let arr = []
    for (const message of pasted) {
      arr.push(<Message sender={message.sender} timestamp={message.timestamp} contents={message.contents} />)
    }
    return (
       arr
    )
  }

  return (
    <div className="App">
      <input onPaste={handlePaste} type="text" id="slack-input" autoComplete="no"></input>
      {generateMessages}
    </div>
  );
}

function Message({sender, timestamp, contents}) {
  return (
    <div>
      <p>{sender} at {timestamp}</p>
     <p>{contents}</p>
    </div>
  )
}

export default App;