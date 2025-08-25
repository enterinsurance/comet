import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Card, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"

export default function Home() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center p-8">
      <div className="text-center space-y-6 mb-12">
        <h1 className="text-6xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
          Comet
        </h1>
        <p className="text-xl text-muted-foreground max-w-2xl">
          Secure document signing platform with PDF upload and electronic signatures
        </p>
        <div className="flex gap-4 justify-center">
          <Button size="lg" asChild>
            <Link href="/auth/register">Get Started</Link>
          </Button>
          <Button variant="outline" size="lg" asChild>
            <Link href="/auth/login">Sign In</Link>
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 w-full max-w-6xl">
        <Card className="transition-all hover:shadow-lg">
          <CardHeader>
            <CardTitle className="text-lg">Document Signing</CardTitle>
            <CardDescription>
              Secure PDF document signing with electronic signatures.
            </CardDescription>
          </CardHeader>
        </Card>

        <Card className="transition-all hover:shadow-lg">
          <CardHeader>
            <CardTitle className="text-lg">Upload & Share</CardTitle>
            <CardDescription>Easy PDF upload with drag-and-drop interface.</CardDescription>
          </CardHeader>
        </Card>

        <Card className="transition-all hover:shadow-lg">
          <CardHeader>
            <CardTitle className="text-lg">Email Integration</CardTitle>
            <CardDescription>Send signing invitations via secure email links.</CardDescription>
          </CardHeader>
        </Card>

        <Card className="transition-all hover:shadow-lg">
          <CardHeader>
            <CardTitle className="text-lg">Secure & Fast</CardTitle>
            <CardDescription>
              Built with modern security practices and authentication.
            </CardDescription>
          </CardHeader>
        </Card>
      </div>

      <div className="mt-12 text-center">
        <p className="text-sm text-muted-foreground">
          Built with Next.js 15, TypeScript, Tailwind CSS, and shadcn/ui
        </p>
      </div>
    </main>
  )
}
