export const config = {
    runtime: "edge",
};

export default async () => {
    const url = "https://github.com/kazumi-sansan/wings-in-bloom-2025/releases/download/v1.0.0/album.pdf";

    const res = await fetch(url);

    return new Response(res.body, {
        headers: {
            "Content-Type": "application/pdf",
            "Content-Disposition": "inline; filename=album.pdf",
            "Access-Control-Allow-Origin": "*",
        },
    });
};
