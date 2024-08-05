import { getData, getUserHandle, updateData, getUserPassword} from './data';

const axios = require("axios");
const cheerio = require("cheerio");
const qs = require("querystring");

const baseUrl = "https://codeforces.com";
let session = {
    csrfToken: "",
    cookie: "",
};

async function login() {
    let data: any = getData();
    const userHandle = getUserHandle();
    if (userHandle === null || userHandle === undefined || userHandle === '') {
        return '';
    }
    if (!data || !data.cookie || data.cookie === '' || !data.lastUpdate || Date.now() - data.lastUpdate > 3600000) {
        return getCsrfAndJid()
        .then(() => {
            return requestLogin();
        })
        .then(() => {
            data.cookie = session.cookie!;
            console.log("Cookie at login(): "+data.cookie);
            data.csrfToken = session.csrfToken;
            data.lastUpdate = Date.now();
            console.log("Time: "+data.lastUpdate);
            return data.cookie;
        });
    } else {
        return data.cookie;
    }
}

function getCsrfAndJid() {
    return axios
    .get(baseUrl + "/enter")
    .then((res: any) => {
        session.cookie = res["headers"]["set-cookie"][0].split(";")[0];
        const $ = cheerio.load(res.data);
        const csrfTokenElement = $("meta[name='X-Csrf-Token']")[0] as cheerio.TagElement;
        session.csrfToken = csrfTokenElement.attribs["content"];
        console.log(session);
        })
        .catch((err: any) => {
        console.log(err);
        });
}

function requestLogin() {
    console.log("Logging...");
    const url = baseUrl + "/enter";
    const user: { handleOrEmail: string, password: string } = {
        handleOrEmail: process.env.CODEFORCES_USERNAME || '',
        password: process.env.CODEFORCES_PASSWORD || '',
    };

    const options = {
        headers: {
            "content-type": "application/x-www-form-urlencoded",
            Cookie: session.cookie,
        },
    };

    const data = {
        ...user,
        csrf_token: session.csrfToken,
        action: "enter",
    };

    return axios
    .post(url, qs.stringify(data), options)
    .then((res: any) => {
    const $ = cheerio.load(res.data);
    const userId = $($(".lang-chooser a")[2]).html();
    session.csrfToken = $("meta[name='X-Csrf-Token']")[0].attribs["content"];
    if(userId === 'Enter') {
        session.cookie = '';
        //handleError("Failed to login user: "+user.handleOrEmail);
        return;
    }
    console.log(`Login Successful. Welcome ${userId}!!!`);
    // .catch((err: any) => {
    //     //handleError(err);
    // 
    });
}

export default login;