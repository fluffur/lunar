import {
    Stack,
    Modal,
    Slider,
    Group,
    Button,
} from "@mantine/core";
import { useRef, useState, useCallback } from "react";
import Cropper, { type Area } from "react-easy-crop";
import { UserAvatar } from "./UserAvatar.tsx";
import getCroppedImg from "../utils/cropImage";
import { api } from "../api.ts";

interface User {
    id: string;
    username: string;
    email: string;
    emailVerified: boolean;
    avatarUrl: string | null;
}

interface AvatarSectionProps {
    user: User;
    setUser: (user: User | null) => void;
}

export default function AvatarSection({ user, setUser }: AvatarSectionProps) {
    const fileInputRef = useRef<HTMLInputElement>(null);
    const [selectedFile, setSelectedFile] = useState<File | null>(null);
    const [preview, setPreview] = useState<string | null>(null);
    const [croppedAreaPixels, setCroppedAreaPixels] = useState<Area | null>(null);
    const [crop, setCrop] = useState({ x: 0, y: 0 });
    const [zoom, setZoom] = useState(1);
    const [uploading, setUploading] = useState(false);
    const [cropModalOpened, setCropModalOpened] = useState(false);

    const handleFileChange = (file: File | null) => {
        setSelectedFile(file);
        if (file) {
            setPreview(URL.createObjectURL(file));
            setCropModalOpened(true);
        } else {
            setPreview(null);
        }
    };

    const onCropComplete = useCallback((_croppedArea: Area, croppedAreaPixels: Area) => {
        setCroppedAreaPixels(croppedAreaPixels);
    }, []);

    const handleUpload = async () => {
        if (!selectedFile || !croppedAreaPixels) return;

        const croppedBlob = await getCroppedImg(selectedFile, croppedAreaPixels);
        const formData = new FormData();
        formData.append("avatar", croppedBlob, selectedFile.name);

        try {
            setUploading(true);
             await api.post("/users/me/avatar", formData, {
                 headers: {"Content-Type": "multipart/form-data"},
             });
            setSelectedFile(null);
            setPreview(null);
            setCropModalOpened(false);
        } catch (err) {
            console.error(err);
        } finally {
            setUploading(false);
        }
    };

    const handleCancelAvatar = () => {
        setSelectedFile(null);
        setPreview(null);
        setCropModalOpened(false);
    };

    return (
        <>
            <UserAvatar
                username={user.username}
                avatarUrl={preview || user.avatarUrl}
                size={100}
                loading={uploading}
                onClick={() => fileInputRef.current?.click()}
            />
            <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                style={{ display: "none" }}
                onChange={(e) => handleFileChange(e.target.files?.[0] || null)}
            />

            <Modal
                opened={cropModalOpened}
                onClose={handleCancelAvatar}
                title="Crop your avatar"
                centered
                size={400}
            >
                {preview && (
                    <Stack align="center">
                        <div style={{ position: "relative", width: 300, height: 300, background: "#333" }}>
                            <Cropper
                                image={preview}
                                crop={crop}
                                zoom={zoom}
                                aspect={1}
                                onCropChange={setCrop}
                                onZoomChange={setZoom}
                                onCropComplete={onCropComplete}
                            />
                        </div>
                        <Slider
                            value={zoom}
                            onChange={setZoom}
                            min={1}
                            max={3}
                            step={0.01}
                            style={{ width: 300 }}
                        />
                        <Group mt="sm">
                            <Button onClick={handleUpload} loading={uploading}>
                                Upload Avatar
                            </Button>
                            <Button color="gray" variant="outline" onClick={handleCancelAvatar}>
                                Cancel
                            </Button>
                        </Group>
                    </Stack>
                )}
            </Modal>
        </>
    );
}
