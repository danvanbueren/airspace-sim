import "./globals.css"

import '@fontsource/roboto/300.css'
import '@fontsource/roboto/400.css'
import '@fontsource/roboto/500.css'
import '@fontsource/roboto/700.css'

import { cookies } from "next/headers";
import AppThemeProvider from "./components/AppThemeProvider";

export const metadata = {
  title: "airspace-sim",
  description: "airspace-sim - Non-secure simulator to train on a simulated operational airspace for Command and Control aircrew. This project is personal, and is not owned, operated, or endorsed by any government entities. This repository is unclassified.",
}

export default async function RootLayout({ children }) {

  const cookieStore = await cookies();
  const themeCookie = cookieStore.get("theme")?.value;
  const initialMode = themeCookie === "dark" ? "dark" : "light";

  return (
    <html lang="en">
      <body>
        <AppThemeProvider initialMode={initialMode}>
          {children}
        </AppThemeProvider>
      </body>
    </html>
  )
}
