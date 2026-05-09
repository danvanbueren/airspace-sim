'use client'

import MapView from "./components/map/MapView"
import {Box} from "@mui/material"
import CategorySelectPanel from "./components/panels/glass/CategorySelectPanel"
import FixedFunctionPanel from "./components/panels/glass/FixedFunctionPanel"
import ClassificationBar from "./components/base/ClassificationBar"
import QuickSettingsContainer from "./components/panels/settings/quick/QuickSettingsContainer"

export default function Home() {
    return (
        <Box
            sx={{
                display: 'flex',
                flexDirection: 'column',
                height: '100dvh',
            }}
        >
            <ClassificationBar/>
            <Box
                style={{
                    position: 'relative',
                    width: '100dvw',
                    flexGrow: 1,
                    overflow: 'hidden',
                    margin: 0,
                    padding: 0,
                }}
            >
                <Box
                    style={{
                        position: 'absolute',
                        top: 20,
                        left: 20,
                        zIndex: 1,
                    }}
                >
                    <CategorySelectPanel/>
                </Box>

                <Box
                    style={{
                        position: 'absolute',
                        bottom: 20,
                        left: 20,
                        zIndex: 1,
                    }}
                >
                    <FixedFunctionPanel/>
                </Box>

                <Box
                    style={{
                        position: 'absolute',
                        top: 20,
                        right: 20,
                        zIndex: 1,
                    }}
                >
                    <QuickSettingsContainer/>
                </Box>
                <MapView/>
            </Box>
            <ClassificationBar/>
        </Box>
    )
}