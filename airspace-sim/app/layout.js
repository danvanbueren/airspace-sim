import './globals.css'

import '@fontsource/roboto/300.css'
import '@fontsource/roboto/400.css'
import '@fontsource/roboto/500.css'
import '@fontsource/roboto/700.css'
import {cookies} from 'next/headers'
import CustomThemeContext from './contexts/CustomThemeContext'
import {
    CONTROL_BINDINGS_COOKIE_NAME, ControlBindingsProvider,
} from './contexts/ControlBindingsContext'
import {
    APP_SETTINGS_COOKIE_NAME,
    AppSettingsProvider,
} from './contexts/AppSettingsContext'
import {UseGlobalInteractionGuards} from '@/app/hooks/global/useGlobalInteractionGuards'
import {THEME_COOKIE_NAME} from '@/app/contexts/CustomThemeContext'
import {MapStateProvider} from './contexts/MapStateContext'
import {SensorDisplayProvider} from './contexts/SensorDisplayContext'
import {SimulationProvider} from './contexts/SimulationContext'

export const dynamic = 'force-dynamic'

export const metadata = {
    title: 'airspace-sim',
    description: 'airspace-sim - Non-secure simulator to train on a simulated operational airspace for Command and Control aircrew. This project is personal, and is not owned, operated, or endorsed by any government entities. This repository is unclassified.',
}

export default async function RootLayout({children}) {
    const cookieStore = await cookies()
    const themeCookie = cookieStore.get(THEME_COOKIE_NAME)?.value
    const controlBindingsCookie = cookieStore.get(CONTROL_BINDINGS_COOKIE_NAME)?.value
    const appSettingsCookie = cookieStore.get(APP_SETTINGS_COOKIE_NAME)?.value

    return (<html lang='en'>
    <body>
    <MapStateProvider>
        <UseGlobalInteractionGuards>
            <CustomThemeContext initialMode={themeCookie}>
                <AppSettingsProvider initialSettings={appSettingsCookie}>
                    <SensorDisplayProvider>
                        <SimulationProvider>
                            <ControlBindingsProvider initialBindings={controlBindingsCookie}>
                                {children}
                            </ControlBindingsProvider>
                        </SimulationProvider>
                    </SensorDisplayProvider>
                </AppSettingsProvider>
            </CustomThemeContext>
        </UseGlobalInteractionGuards>
    </MapStateProvider>
    </body>
    </html>)
}
