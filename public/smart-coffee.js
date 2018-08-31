import jsonApi from "../shared/json-api.js";
import TpLinkCloud from "../shared/tplink-cloud.js";

class SmartCoffee {

    /**
     * Authenticate the user for gaining access to config
     * @param {String} email
     * @param {String} password
     * @returns {Promise<TpLinkCloud>}
     * @throws If login failed
     */
    async login(email, password) {
        const tplink = new TpLinkCloud({email, password});
        const response = await jsonApi.post('/api/tplink/login', {
            email,
            password,
        });
        tplink.token = (await response.json()).token;
        return tplink;
    }

    async getDevices(token) {
        return await (await jsonApi.get(`/api/tplink/devices?token=${token}`)).json();
    }
}

export default SmartCoffee;
