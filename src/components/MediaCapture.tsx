import { useEffect, useState } from "react";
import { Camera, FileUp, Video } from "lucide-react";
import { Button } from "@/components/ui/button";

type MediaCaptureProps = {
  id: string;
  file?: File | undefined;
  onFile: (file: File | undefined) => void;
  allowVideo?: boolean;
  allowFiles?: boolean;
  required?: boolean;
};

export function MediaCapture({
  id,
  file,
  onFile,
  allowVideo = false,
  allowFiles = false,
  required = false,
}: MediaCaptureProps) {
  const [previewUrl, setPreviewUrl] = useState<string>();

  useEffect(() => {
    if (!file || (!file.type.startsWith("image/") && !file.type.startsWith("video/"))) {
      setPreviewUrl(undefined);
      return;
    }
    const url = URL.createObjectURL(file);
    setPreviewUrl(url);
    return () => URL.revokeObjectURL(url);
  }, [file]);

  const choose = (event: React.ChangeEvent<HTMLInputElement>) => {
    onFile(event.target.files?.[0]);
    event.target.value = "";
  };

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap gap-2">
        <Button asChild type="button" variant="outline" size="sm">
          <label htmlFor={`${id}-photo`} className="cursor-pointer">
            <Camera className="size-4" /> Fotografar
          </label>
        </Button>
        <input
          id={`${id}-photo`}
          type="file"
          accept="image/*"
          capture="environment"
          className="sr-only"
          onChange={choose}
        />

        {allowVideo ? (
          <>
            <Button asChild type="button" variant="outline" size="sm">
              <label htmlFor={`${id}-video`} className="cursor-pointer">
                <Video className="size-4" /> Gravar vídeo
              </label>
            </Button>
            <input
              id={`${id}-video`}
              type="file"
              accept="video/*"
              capture="environment"
              className="sr-only"
              onChange={choose}
            />
          </>
        ) : null}

        {allowFiles ? (
          <>
            <Button asChild type="button" variant="outline" size="sm">
              <label htmlFor={`${id}-file`} className="cursor-pointer">
                <FileUp className="size-4" /> Escolher arquivo
              </label>
            </Button>
            <input
              id={`${id}-file`}
              type="file"
              accept={allowVideo ? "image/*,video/*,application/pdf" : "image/*,application/pdf"}
              className="sr-only"
              onChange={choose}
            />
          </>
        ) : null}
      </div>

      {file ? (
        <div className="max-w-sm rounded-md border border-border p-2">
          {previewUrl && file.type.startsWith("image/") ? (
            <img src={previewUrl} alt="Prévia da captura" className="max-h-52 w-full rounded object-contain" />
          ) : null}
          {previewUrl && file.type.startsWith("video/") ? (
            <video src={previewUrl} controls className="max-h-52 w-full rounded" />
          ) : null}
          <p className="mt-2 truncate text-xs text-muted-foreground">{file.name}</p>
        </div>
      ) : required ? (
        <p className="text-xs text-muted-foreground">Uma foto ou um vídeo é obrigatório.</p>
      ) : null}
    </div>
  );
}