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
              {/* Farcaster Frame Meta Tags */}
          <meta property="fc:frame" content="vNext" />
          <meta property="fc:frame:image" content={`${APP_URL}/api/og`} />
          <meta property="fc:frame:button:1" content="Check In" />
          <meta property="fc:frame:button:1:action" content="link" />
          <meta property="fc:frame:button:1:target" content={`${APP_URL}/farcaster`} />
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