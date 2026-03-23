import { config } from './config/wagmi-config';


declare module  "wagmi" {
    interface Register {
        config:typeof config
    }
}           