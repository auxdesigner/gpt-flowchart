var nodes = [];
var nodesContent = [];
var defaultNodeHTML = `
  <div class="input-box">
    <input type="text" id="inputMsg" placeholder="Topic"></div>
    <button id="add-btn" onclick="buttonClick()">Get ideas</button>
  </div>
  <div class="loading">
    <div class="loading-dot"></div>
    <div class="loading-dot"></div>
    <div class="loading-dot"></div>
  </div>
  `;

var id = document.getElementById("drawflow");
const editor = new Drawflow(id);
editor.reroute = true;
editor.reroute_fix_curvature = true;
editor.force_first_input = false;

editor.start();
editor.addNode("og", 0, 1, 50, 100, "node-og", {}, defaultNodeHTML);
//name, inputs, outputs, posx, posy, class, data, html

// Events!
editor.on("nodeCreated", function (id) {
  nodes.push(id);
});

editor.on("nodeSelected", function (id) {
  if (id == "1") {
    editor.node_selected = null;
    editor.dispatch("nodeUnselected", true);
  } else {
    document.querySelector("div#node-" + id + " .loading").style.display =
      "block";
    console.log(nodesContent[Number(id) - 2]);
    sendToGPT(id, nodesContent[Number(id) - 2]);
  }
});

function addIdeaNodes(id, content1, content2) {
  var nodePosX = editor.getNodeFromId(id).pos_x,
    nodePosY = editor.getNodeFromId(id).pos_y;

  editor.addNode(
    "idea 1",
    1,
    1,
    nodePosX + 350,
    nodePosY - 50,
    "node-up",
    {},
    `
      <div class="title-box">` +
      content1 +
      `</div>
      <div class="loading">
        <div class="loading-dot"></div>
        <div class="loading-dot"></div>
        <div class="loading-dot"></div>
      </div>
    `
  );
  editor.addNode(
    "idea 2",
    1,
    1,
    nodePosX + 350,
    nodePosY + 50,
    "node-down",
    {},
    `
      <div class="title-box">` +
      content2 +
      `</div>
      <div class="loading">
        <div class="loading-dot"></div>
        <div class="loading-dot"></div>
        <div class="loading-dot"></div>
      </div>
          `
  );

  editor.addConnection(id, nodes[nodes.length - 2], "output_1", "input_1");
  editor.addConnection(id, nodes[nodes.length - 1], "output_1", "input_1");
}

function buttonClick() {
  document.querySelector("div#node-1 .loading").style.display = "block";
  sendToGPT(1, inputMsg.value);
}

var OPENAI_API_KEY = "*****";

function sendToGPT(id, query) {
  var sQuestion =
    "Return 2 ideas on the following topic. Each one is less than 10 words. Put the response in a JSON with idea1 and idea2." +
    query;
  if (sQuestion == "") {
    alert("Type in your question!");
    txtMsg.focus();
    return;
  }

  var oHttp = new XMLHttpRequest();
  oHttp.open("POST", "https://api.openai.com/v1/completions");
  oHttp.setRequestHeader("Accept", "application/json");
  oHttp.setRequestHeader("Content-Type", "application/json");
  oHttp.setRequestHeader("Authorization", "Bearer " + OPENAI_API_KEY);

  oHttp.onreadystatechange = function () {
    if (oHttp.readyState === 4) {
      var oJson = {};
      var outputMsg;
      try {
        oJson = JSON.parse(oHttp.responseText);
      } catch (ex) {
        outputMsg = "Error: " + ex.message;
      }

      if (oJson.error && oJson.error.message) {
        outputMsg = "Error: " + oJson.error.message;
      } else if (oJson.choices && oJson.choices[0].text) {
        var response = oJson.choices[0].text;

        if (response == "") response = "No response";
        // console.log(JSON.parse(response));

        var answer1 = JSON.parse(response)["idea1"],
          answer2 = JSON.parse(response)["idea2"];

        console.log(answer1);
        console.log(answer2);

        nodesContent.push(answer1);
        nodesContent.push(answer2);

        addIdeaNodes(id, answer1, answer2);
        //document.querySelectorAll("div.loading").style.display = "none";
        document.querySelector("div#node-" + id + " .loading").style.display =
          "none";
      }
    }
  };

  var sModel = "text-davinci-003"; // "text-davinci-003";
  var iMaxTokens = 1024;
  var sUserId = "1";
  var dTemperature = 0.5;
  var data = {
    model: sModel,
    prompt: sQuestion,
    max_tokens: iMaxTokens,
    user: sUserId,
    temperature: dTemperature,
    frequency_penalty: 0.0, //Number between -2.0 and 2.0 //Positive values decrease the model's likelihood //to repeat the same line verbatim.
    presence_penalty: 0.0, //Number between -2.0 and 2.0. //Positive values increase the model's likelihood //to talk about new topics.
    stop: ["#", ";"], //Up to 4 sequences where the API will stop //generating further tokens. The returned text //will not contain the stop sequence.
  };

  oHttp.send(JSON.stringify(data));
}
