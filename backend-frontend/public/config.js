import SmartCoffee from './smart-coffee.js';
import jsonApi from '../shared/json-api.js';

let smartCoffee = new SmartCoffee;
/** @type {HTMLInputElement} */
let select = document.querySelector('#cloud-config-device');
/** @type {HTMLInputElement} */
let txtEmail = document.querySelector('#cloud-config-email');
/** @type {HTMLInputElement} */
let txtPassword = document.querySelector('#cloud-config-password');
/** @type {HTMLInputElement} */
let txtSlackUrl = document.querySelector('#cloud-config-slack-url');

let config;

document.querySelector("#cloud-config-list-devices").addEventListener('click', async (e) => {
  e.preventDefault();

  try {
    config = await smartCoffee.login(txtEmail.value, txtPassword.value);
  } catch (err) {
    alert("Kirjautuminen epäonnistui!");
    return;
  }

  let devices = await smartCoffee.getDevices(config.token);

  while (select.firstChild)
    select.removeChild(select.firstChild);

  if (devices.length) {
    for (let i = 0; i < devices.length; i++) {
      select.appendChild(new Option(devices[i].alias, JSON.stringify(devices[i])));
    }
    select.disabled = false;
  } else {
    select.appendChild(new Option("No compatible devices found!", ""));
    select.disabled = true;
  }
});

document.querySelector("#cloud-config-save").addEventListener('click', async (e) => {
  if (select.value) {
    var device = JSON.parse(select.value);
    config.deviceId = device.deviceId;
    config.alias = device.alias;
    config.appServerUrl = device.appServerUrl;
  }

  if (txtEmail.value && !config.email)
    config.email = txtEmail.value;

  try {
    await jsonApi.put("/api/coffeemakers/", {
      cloud: config,
      slackUrl: txtSlackUrl.value
    });
  } catch (e) {
    alert(e);
  }
});
