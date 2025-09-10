import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import Link from "next/link"

export default async function ErrorPage({
  searchParams,
}: {
  searchParams: Promise<{ error: string }>
}) {
  const params = await searchParams

  return (
    <div className="flex min-h-screen w-full items-center justify-center p-6 bg-background">
      <div className="w-full max-w-sm">
        <div className="flex flex-col gap-6">
          <Card className="shadow-lg">
            <CardHeader className="text-center">
              <CardTitle className="text-2xl font-semibold text-destructive">Error de Autenticación</CardTitle>
            </CardHeader>
            <CardContent className="text-center space-y-4">
              {params?.error ? (
                <p className="text-sm text-muted-foreground">Error: {params.error}</p>
              ) : (
                <p className="text-sm text-muted-foreground">
                  Ha ocurrido un error inesperado durante la autenticación.
                </p>
              )}

              <div className="pt-4">
                <Button asChild className="w-full">
                  <Link href="/auth/login">Volver al Login</Link>
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
