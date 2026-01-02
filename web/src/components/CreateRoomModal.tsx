import { Modal } from '@mantine/core';
import { CreateRoomForm } from "./CreateRoomForm.tsx";

interface CreateRoomModalProps {
    opened: boolean;
    onClose: () => void;
}

export function CreateRoomModal({ opened, onClose }: CreateRoomModalProps) {
    return (
        <Modal opened={opened} onClose={onClose} title="Room Actions" centered radius="lg">
            <CreateRoomForm onSuccess={onClose} />
        </Modal>
    );
}

