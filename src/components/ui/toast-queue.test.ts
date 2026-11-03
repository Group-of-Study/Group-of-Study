import { describe, expect, it } from "vitest";
import { addToast, MAX_TOASTS, removeToast, type ToastItem } from "./toast-queue";

function toast(id: number): ToastItem {
    return { id, tone: "success", title: `Toast ${id}` };
}

describe("fila de toasts", () => {
    it("adiciona no fim", () => {
        expect(addToast([toast(1)], toast(2)).map((t) => t.id)).toEqual([1, 2]);
    });

    it(`mantém no máximo ${MAX_TOASTS}, tirando o mais antigo`, () => {
        let list: ToastItem[] = [];
        for (let id = 1; id <= MAX_TOASTS + 1; id++) {
            list = addToast(list, toast(id));
        }
        expect(list.map((t) => t.id)).toEqual([2, 3, 4]);
    });

    it("remove pelo id", () => {
        expect(removeToast([toast(1), toast(2), toast(3)], 2).map((t) => t.id)).toEqual([1, 3]);
    });

    it("remover um id que não existe não muda nada", () => {
        expect(removeToast([toast(1)], 9)).toEqual([toast(1)]);
    });
});
