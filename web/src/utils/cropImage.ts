export default function getCroppedImg(file: File, crop: { x: number; y: number; width: number; height: number }): Promise<Blob> {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.readAsDataURL(file);
        reader.onload = () => {
            const image = new Image();
            image.src = reader.result as string;
            image.onload = () => {
                const canvas = document.createElement("canvas");
                canvas.width = crop.width;
                canvas.height = crop.height;
                const ctx = canvas.getContext("2d");

                if (!ctx) {
                    reject(new Error("Canvas context not found"));
                    return;
                }

                ctx.drawImage(
                    image,
                    crop.x,
                    crop.y,
                    crop.width,
                    crop.height,
                    0,
                    0,
                    crop.width,
                    crop.height
                );

                canvas.toBlob((blob) => {
                    if (!blob) {
                        reject(new Error("Failed to create blob"));
                        return;
                    }
                    resolve(blob);
                }, "image/jpeg");
            };
            image.onerror = (err) => reject(err);
        };
        reader.onerror = (err) => reject(err);
    });
}
