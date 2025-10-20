import Document, { Html, Head, Main, NextScript, DocumentContext } from 'next/document';

class MyDocument extends Document {
  static async getInitialProps(ctx: DocumentContext) {
    const initialProps = await Document.getInitialProps(ctx);
    return { ...initialProps };
  }

  render() {
    const APP_URL = process.env.NEXT_PUBLIC_APP_URL || 'http://gannetx.space';

    return (
      <Html lang="en">
         <Head>
        {/* Preload Farcaster SDK */}
        <link
          rel="modulepreload"
          href="https://esm.sh/@farcaster/frame-sdk"
        />
      </Head>
        <body>
          <Main />
          <NextScript />
        </body>
      </Html>
    );
  }
}

export default MyDocument;