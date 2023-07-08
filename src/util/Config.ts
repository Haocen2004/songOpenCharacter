import fs from 'fs';
import { resolve } from 'path';
import { VerboseLevel } from './Logger';

const DEFAULT_CONFIG = {
    // General
    VERBOSE_LEVEL: 1,
    CONFIG_VERSION: 1,
    MONGO_URI: "mongodb://0.0.0.0:27017/sgc",
    // HTTP
    HTTP: {
        HTTP_HOST: "0.0.0.0",
        HTTP_PORT: 8088
    }

}
type DefaultConfig = typeof DEFAULT_CONFIG;

function r(...args: string[]) {
    return fs.readFileSync(resolve(__dirname, ...args)).toString();
}

function readConfig(): any {
    let config: DefaultConfig;
    try {
        config = JSON.parse(r('../../config.json'));
        // Check if config object.keys is the same as DEFAULT_CONFIG.keys
        if (config.CONFIG_VERSION != DEFAULT_CONFIG.CONFIG_VERSION) {
            console.error("config version MISMATCH, backup to ./config.json.bak and resetting...");
            fs.writeFileSync('./config.json.bak', JSON.stringify(config, null, 2));
            config = DEFAULT_CONFIG;
            updateConfig(config);
            process.exit(0)
        }
        const missing = Object.keys(DEFAULT_CONFIG).filter(key => !config.hasOwnProperty(key));

        if (missing.length > 0) {
            missing.forEach(key => {
                // @ts-ignore
                config[key] = DEFAULT_CONFIG[key];
            });
            updateConfig(config);
            console.log(`Added missing config keys: ${missing.join(', ')}\nPlease check your config file for new keys.`);
            process.exit(0)
        }
    } catch {
        console.error("Could not read config file. Creating one for you...");
        config = DEFAULT_CONFIG;
        updateConfig(config);
        process.exit(0)
    }
    return config;
}

function updateConfig(config: any) {
    fs.writeFileSync('./config.json', JSON.stringify(config, null, 2));
}

export default class Config {
    static save(config: any) {
        updateConfig(config)
    }
    public static config = readConfig();
    public static CONFIG_VERSION: number;
    public static VERBOSE_LEVEL: VerboseLevel = Config.config.VERBOSE_LEVEL;
    public static HTTP: {
        HTTP_HOST: string,
        HTTP_PORT: number
    } = Config.config.HTTP;
    public static MONGO_URI: string = Config.config.MONGO_URI;
    private constructor() { }
}
