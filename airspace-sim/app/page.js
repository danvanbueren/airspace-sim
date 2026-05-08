'use client'

import MapView from "./components/MapView"
import {Box} from "@mui/material"
import CategorySelectPanel from "./components/panels/CategorySelectPanel"
import FixedFunctionPanel from "./components/panels/FixedFunctionPanel"
import ClassificationBar from "./components/ClassificationBar"
import FloatingPanel from "./components/panels/floating/FloatingPanel"

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
                        bottom: 40,
                        right: 40,
                        zIndex: 1,
                    }}
                >
                    <FloatingPanel/>
                </Box>
                <MapView/>
            </Box>
            <ClassificationBar/>
        </Box>
    )
}