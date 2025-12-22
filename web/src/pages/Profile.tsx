import { Center, Paper, Stack, Text, Button, Title, TextInput, Group, ActionIcon, Collapse, Slider, Modal } from "@mantine/core";
import { IconEdit, IconCheck, IconX } from "@tabler/icons-react";
import { useSessionStore } from "../stores/sessionStore.ts";
import { api } from "../api.ts";
import { useNavigate } from "react-router-dom";
import { useRef, useState, useCallback } from "react";
import Cropper, {type Area } from "react-easy-crop";
import { UserAvatar } from "../components/UserAvatar.tsx";
import getCroppedImg from "../utils/cropImage";

export default function Profile() {
    const { user, logout, setUser } = useSessionStore();
    const navigate = useNavigate();
    const fileInputRef = useRef<HTMLInputElement>(null);

    const [selectedFile, setSelectedFile] = useState<File | null>(null);
    const [preview, setPreview] = useState<string | null>(null);
    const [croppedAreaPixels, setCroppedAreaPixels] = useState<Area | null>(null);
    const [crop, setCrop] = useState({ x: 0, y: 0 });
    const [zoom, setZoom] = useState(1);
    const [uploading, setUploading] = useState(false);
    const [cropModalOpened, setCropModalOpened] = useState(false);

    const [email, setEmail] = useState(user?.email || "");
    const [originalEmail, setOriginalEmail] = useState(email);
    const [isEditingEmail, setIsEditingEmail] = useState(false);
    const [emailSaved, setEmailSaved] = useState(false);
    const [verifyingEmail, setVerifyingEmail] = useState(false);

    const [changingPassword, setChangingPassword] = useState(false);
    const [currentPassword, setCurrentPassword] = useState("");
    const [newPassword, setNewPassword] = useState("");

    if (!user) {
        return (
            <Center h="100vh">
                <Text>User not found</Text>
            </Center>
        );
    }

    const handleLogout = async () => {
        try { await api.post("/auth/logout"); } finally {
            logout();
            navigate("/login");
        }
    };

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
            const { data } = await api.post("/users/me/avatar", formData, {
                headers: { "Content-Type": "multipart/form-data" },
            });
            setUser(data);
            setSelectedFile(null);
            setPreview(null);
            setCropModalOpened(false);
        } catch (err) { console.error(err); } finally { setUploading(false); }
    };

    const handleCancelAvatar = () => {
        setSelectedFile(null);
        setPreview(null);
        setCropModalOpened(false);
    };

    const handleEmailSave = async () => {
        if (email === originalEmail) return setIsEditingEmail(false);

        try {
            const { data } = await api.patch("/users/me/email", { email });
            setUser({ ...data, emailVerified: false });
            setOriginalEmail(email);
            setEmailSaved(true);
            setIsEditingEmail(false);
            setTimeout(() => setEmailSaved(false), 3000);
        } catch (err) { console.error(err); }
    };

    const handleEmailCancel = () => {
        setEmail(originalEmail);
        setIsEditingEmail(false);
    };

    const handleSendVerification = async () => {
        try {
            setVerifyingEmail(true);
            await api.post("/users/me/send-verification");
        } catch (err) { console.error(err); } finally { setVerifyingEmail(false); }
    };

    const handleChangePassword = async () => {
        try {
            await api.post("/users/me/change-password", { currentPassword, newPassword });
            setChangingPassword(false);
            setCurrentPassword("");
            setNewPassword("");
        } catch (err) { console.error(err); }
    };

    const handlePasswordCancel = () => {
        setChangingPassword(false);
        setCurrentPassword("");
        setNewPassword("");
    };

    return (
        <Center h="calc(100vh - 80px)" p="md">
            <Paper shadow="sm" withBorder radius="lg" p="xl" w="100%" maw={500}>
                <Stack align="center">
                    <UserAvatar
                        username={user.username}
                        avatarUrl={preview || user.avatarUrl}
                        size={80}
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

                    <Modal opened={cropModalOpened} onClose={handleCancelAvatar} title="Crop your avatar" centered size={400}>
                        {preview && (
                            <Stack align="center">
                                <div style={{ position: 'relative', width: 300, height: 300, background: '#333' }}>
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
                                    <Button onClick={handleUpload} loading={uploading}>Upload Avatar</Button>
                                    <Button color="gray" variant="outline" onClick={handleCancelAvatar}>Cancel</Button>
                                </Group>
                            </Stack>
                        )}
                    </Modal>

                    <Title order={2}>{user.username}</Title>

                    <Stack w="100%">
                        <TextInput
                            label="Email"
                            value={email}
                            onChange={(e) => setEmail(e.currentTarget.value)}
                            disabled={!isEditingEmail}
                            w="100%"
                            rightSection={
                                isEditingEmail ? (
                                    <Group display="flex" wrap="nowrap" gap={4} align="center">
                                        <ActionIcon color="green" onClick={handleEmailSave}><IconCheck size={18} /></ActionIcon>
                                        <ActionIcon color="red" onClick={handleEmailCancel}><IconX size={18} /></ActionIcon>
                                    </Group>
                                ) : (
                                    <ActionIcon onClick={() => setIsEditingEmail(true)}><IconEdit size={18} /></ActionIcon>
                                )
                            }
                            rightSectionWidth={isEditingEmail ? 65 : 40}
                        />
                        <Group w="100%">
                            {!user.emailVerified && (
                                <Button variant="light" color="blue" onClick={handleSendVerification} loading={verifyingEmail}>
                                    Verify Email
                                </Button>
                            )}
                        </Group>
                        <Collapse in={emailSaved}>
                            <Text color="green" size="sm">Email updated. Please verify new email.</Text>
                        </Collapse>
                    </Stack>

                    {!changingPassword && (
                        <Button variant="outline" mt="sm" fullWidth onClick={() => setChangingPassword(true)}>Change Password</Button>
                    )}
                    {changingPassword && (
                        <Stack w="100%">
                            <TextInput type="password" placeholder="Current password" value={currentPassword} onChange={(e) => setCurrentPassword(e.currentTarget.value)} w="100%" />
                            <TextInput type="password" placeholder="New password" value={newPassword} onChange={(e) => setNewPassword(e.currentTarget.value)} w="100%" />
                            <Group w="100%">
                                <Button onClick={handleChangePassword} fullWidth>Submit</Button>
                                <Button color="gray" variant="outline" onClick={handlePasswordCancel} fullWidth>Cancel</Button>
                            </Group>
                        </Stack>
                    )}

                    <Button color="red" variant="outline" mt="lg" fullWidth onClick={handleLogout}>Logout</Button>
                </Stack>
            </Paper>
        </Center>
    );
}
