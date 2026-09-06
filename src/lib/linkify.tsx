const URL_RE = /(https?:\/\/[^\s]+)/g;

// Renders plain text with bare http(s) URLs turned into links — never
// dangerouslySetInnerHTML, so nothing else in the message can inject markup.
export function Linkify({ text }: { text: string }) {
  const parts = text.split(URL_RE);
  return (
    <>
      {parts.map((part, i) =>
        i % 2 === 1 ? (
          <a
            key={i}
            href={part}
            target="_blank"
            rel="noopener noreferrer nofollow ugc"
            className="text-accent underline"
          >
            {part}
          </a>
        ) : (
          part
        )
      )}
    </>
  );
}
