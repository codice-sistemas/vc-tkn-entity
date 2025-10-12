export default function Table({ children }: { children: React.ReactNode }) {
  return <table style={{ width: '100%', borderCollapse: 'collapse' }}>{children}</table>;
}
```

## `src/components/Pagination.tsx`

```tsx
export default function Pagination({ onNext, onPrev }: { onNext?: () => void; onPrev?: () => void }) {
  return (
    <div>
      <button onClick={onPrev}>Anterior</button>
      <button onClick={onNext}>Próximo</button>
    </div>
  );
}