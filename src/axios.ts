import axios, { AxiosRequestConfig } from "axios";
import login from "./login";
import { InternalAxiosRequestConfig } from "axios";
import { AxiosHeaders } from "axios";

const instance = axios.create({ baseURL: "https://codeforces.com" });
instance.interceptors.request.use((config: InternalAxiosRequestConfig) => {
    return login()
    .then((cookie) => {
        if (!config.headers) {
            config.headers = new AxiosHeaders();
        }
        console.log(cookie);
        config.headers.Cookie = cookie;
        return config;
    })
    .catch((error) => {
        return Promise.reject(error);
    });
});

export default instance;