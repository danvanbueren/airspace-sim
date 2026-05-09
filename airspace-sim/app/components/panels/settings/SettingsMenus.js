import HistoryEduIcon from '@mui/icons-material/HistoryEdu'
import SettingsIcon from '@mui/icons-material/Settings'
import KeyboardIcon from '@mui/icons-material/Keyboard'
import InfoIcon from '@mui/icons-material/Info'

export default function SettingsMenus(fullSize = true) {

    const settingsStates = [
        {settings: <SettingsIcon/>},
        {keybinds: <KeyboardIcon/>},
        {roadmap: <HistoryEduIcon/>},
        {about: <InfoIcon/>}
    ]

    if (fullSize) {
        return (
            <>
                {settingsStates.map((state, index) => (
                    <div key={index}>
                        {state.settings}
                    </div>
                ))}
            </>
        )
    } else {
        return (
            <>
            </>
        )
    }
}