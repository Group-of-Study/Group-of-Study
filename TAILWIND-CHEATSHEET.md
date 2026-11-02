# Tailwind CSS — Guia de Prática

Este arquivo serve como consulta rápida durante o desenvolvimento.


---

## 1. Margem — `margin`

### Margem em cima

```tsx
mt-4
```

`mt` = margin-top

```css
margin-top: 1rem;
```

### Margem embaixo

```tsx
mb-4
```

`mb` = margin-bottom

```css
margin-bottom: 1rem;
```

### Margem à esquerda

```tsx
ml-4
```

```css
margin-left: 1rem;
```

### Margem à direita

```tsx
mr-4
```

```css
margin-right: 1rem;
```

### Margem horizontal

```tsx
mx-4
```

Aplica margem dos dois lados:

```css
margin-left: 1rem;
margin-right: 1rem;
```

### Margem vertical

```tsx
my-4
```

```css
margin-top: 1rem;
margin-bottom: 1rem;
```

### Centralizar horizontalmente

```tsx
mx-auto
```

Muito usado em containers:

```tsx
<div className="mx-auto max-w-6xl">
```

---

# 2. Padding — `padding`

Padding é o espaço **dentro** do elemento.

### Todos os lados

```tsx
p-4
```

```css
padding: 1rem;
```

### Em cima

```tsx
pt-4
```

### Embaixo

```tsx
pb-4
```

### Esquerda

```tsx
pl-4
```

### Direita

```tsx
pr-4
```

### Horizontal

```tsx
px-6
```

```css
padding-left: 1.5rem;
padding-right: 1.5rem;
```

### Vertical

```tsx
py-8
```

```css
padding-top: 2rem;
padding-bottom: 2rem;
```

---

# 3. Tamanho do texto

```tsx
text-sm
text-base
text-lg
text-xl
text-2xl
text-3xl
text-4xl
text-5xl
text-6xl
text-7xl
text-8xl
```

Quanto maior o número, maior o texto.

Exemplo:

```tsx
<h1 className="text-4xl">
  Meu título
</h1>
```

---

# 4. Peso da fonte

```tsx
font-light
font-normal
font-medium
font-semibold
font-bold
font-extrabold
```

Exemplo:

```tsx
<h1 className="font-bold">
  Título
</h1>
```

`font-bold` equivale aproximadamente a:

```css
font-weight: 700;
```

---

# 5. Cor do texto

Exemplos:

```tsx
text-black
text-white
text-zinc-500
text-zinc-600
text-zinc-700
text-zinc-900
text-blue-500
text-blue-600
text-red-500
text-green-500
```

Exemplo:

```tsx
<p className="text-zinc-600">
  Texto secundário
</p>
```

---

# 6. Cor de fundo

Use `bg-`.

```tsx
bg-white
bg-black
bg-zinc-50
bg-zinc-100
bg-zinc-200
bg-zinc-900
bg-blue-500
bg-blue-600
bg-red-500
```

Exemplo:

```tsx
<section className="bg-zinc-50">
```

---

# 7. Flexbox

## Ativar Flexbox

```tsx
flex
```

Exemplo:

```tsx
<div className="flex">
```

---

## Direção vertical

```tsx
flex-col
```

Os elementos ficam:

```text
A
B
C
```

É equivalente a:

```css
flex-direction: column;
```

---

## Direção horizontal

```tsx
flex-row
```

Os elementos ficam:

```text
A   B   C
```

Equivale a:

```css
flex-direction: row;
```

---

# 8. Alinhamento

## Centralizar verticalmente

```tsx
items-center
```

Equivale a:

```css
align-items: center;
```

## Alinhar no começo

```tsx
items-start
```

## Alinhar no final

```tsx
items-end
```

---

# 9. Distribuição dos elementos

## Espaço entre os elementos

```tsx
justify-between
```

Equivale a:

```css
justify-content: space-between;
```

Exemplo:

```tsx
<div className="flex justify-between">
```

Visualmente:

```text
A                         B
```

---

## Centralizar

```tsx
justify-center
```

```text
        A   B
```

---

## Começo

```tsx
justify-start
```

## Final

```tsx
justify-end
```

---

# 10. Espaçamento entre elementos

```tsx
gap-1
gap-2
gap-3
gap-4
gap-6
gap-8
gap-10
gap-12
```

Exemplo:

```tsx
<div className="flex gap-4">
```

Significa:

> Coloque espaço de `1rem` entre os elementos.

Muito útil para:

```tsx
<div className="flex gap-4">
  <button>Entrar</button>
  <button>Criar conta</button>
</div>
```

---

# 11. Largura

```tsx
w-full
```

Ocupa toda a largura disponível.

```tsx
w-1/2
```

Metade da largura.

```tsx
w-1/3
```

Um terço.

```tsx
w-1/4
```

Um quarto.

Também existem tamanhos específicos:

```tsx
w-10
w-20
w-32
w-40
w-64
```

---

# 12. Altura

```tsx
h-full
h-screen
h-10
h-20
h-32
h-64
```

### Tela inteira

```tsx
min-h-screen
```

Muito comum em páginas:

```tsx
<main className="min-h-screen">
```

---

# 13. Largura máxima

Muito importante para páginas.

```tsx
max-w-sm
max-w-md
max-w-lg
max-w-xl
max-w-2xl
max-w-3xl
max-w-4xl
max-w-5xl
max-w-6xl
max-w-7xl
```

Exemplo:

```tsx
<div className="max-w-xl">
```

Isso impede que o conteúdo fique largo demais.

---

# 14. Alinhamento do texto

```tsx
text-left
text-center
text-right
```

Exemplo:

```tsx
<p className="text-center">
```

---

# 15. Bordas

```tsx
border
```

Adiciona uma borda.

```tsx
border-2
```

Borda mais grossa.

### Cor

```tsx
border-zinc-200
border-zinc-300
border-blue-500
```

Exemplo:

```tsx
<button className="border border-zinc-200">
```

---

# 16. Arredondamento

```tsx
rounded
rounded-md
rounded-lg
rounded-xl
rounded-2xl
rounded-full
```

### Muito arredondado

```tsx
rounded-full
```

Útil para:

- avatar
- botão arredondado
- badge
- círculo

Exemplo:

```tsx
<div className="h-10 w-10 rounded-full">
```

---

# 17. Sombra

```tsx
shadow
shadow-sm
shadow-md
shadow-lg
shadow-xl
```

Exemplo:

```tsx
<div className="rounded-lg shadow-md">
```

---

# 18. Display

```tsx
block
inline
inline-block
hidden
```

`hidden` esconde o elemento.

Exemplo:

```tsx
<div className="hidden">
```

---

# 19. Responsividade

Essa é uma das partes MAIS importantes.

Você pode colocar um prefixo antes da classe:

```tsx
sm:
md:
lg:
xl:
2xl:
```

Exemplo:

```tsx
text-4xl md:text-6xl
```

Significa:

```text
Celular
↓
text-4xl

md para cima
↓
text-6xl
```

Outro exemplo:

```tsx
flex-col md:flex-row
```

No celular:

```text
A
B
```

No desktop:

```text
A  B
```

---

# 20. Breakpoints

A ideia geral:

```text
sm → telas pequenas
md → telas médias
lg → telas grandes
xl → telas muito grandes
2xl → telas extremamente grandes
```

Você pode combinar:

```tsx
text-center md:text-left
```

No celular:

```text
texto centralizado
```

No desktop:

```text
texto à esquerda
```

---

# 21. Hover

Para alterar algo quando o mouse passa por cima:

```tsx
hover:bg-blue-700
```

Exemplo:

```tsx
<button className="bg-blue-600 hover:bg-blue-700">
```

Normal:

```text
azul
```

Mouse em cima:

```text
azul mais escuro
```

---

# 22. Transição

```tsx
transition
```

Pode combinar com hover:

```tsx
transition hover:bg-blue-700
```

---

# 23. Opacidade

```tsx
opacity-50
```

Exemplo:

```tsx
<p className="opacity-50">
```

Deixa o elemento parcialmente transparente.

---

# 24. Overflow

```tsx
overflow-hidden
```

Esconde conteúdo que ultrapassa os limites do elemento.

Muito usado em cards e imagens.

---

# 25. Posicionamento

```tsx
relative
absolute
fixed
sticky
```

Exemplo:

```tsx
<div className="relative">
```

Um elemento dentro dele pode usar:

```tsx
<div className="absolute">
```

---

# 26. Espaço vertical entre elementos

Além de `gap`, existe:

```tsx
space-y-4
```

Isso adiciona espaço vertical entre elementos filhos.

Exemplo:

```tsx
<div className="space-y-4">
  <p>Primeiro</p>
  <p>Segundo</p>
  <p>Terceiro</p>
</div>
```

---

# 27. Cursor

```tsx
cursor-pointer
```

Indica que algo pode ser clicado.

---

# 28. Classes que você provavelmente mais usará neste projeto

Comece dominando estas:

```text
mt-4
mb-4
p-4
px-6
py-8

text-sm
text-base
text-lg
text-xl
text-2xl
text-4xl
text-6xl

font-medium
font-semibold
font-bold

text-zinc-600
text-zinc-900
text-white

bg-white
bg-zinc-50
bg-zinc-900
bg-blue-600

flex
flex-col
flex-row

items-center
items-start

justify-center
justify-between

gap-4
gap-6
gap-8
gap-12

w-full
max-w-xl
max-w-6xl

h-full
min-h-screen

text-center
text-left

border
border-zinc-200

rounded-md
rounded-lg
rounded-xl
rounded-full

shadow-md

hidden

md:
lg:

hover:
transition
```

---

# 29. Como ler uma classe Tailwind

Quando encontrar algo assim:

```tsx
className="flex flex-col items-center gap-4 px-6 md:flex-row"
```

não tente decorar a frase inteira.

Leia uma classe por vez:

```text
flex
↓
usar Flexbox

flex-col
↓
elementos em coluna

items-center
↓
centralizar

gap-4
↓
espaço entre eles

px-6
↓
padding horizontal

md:flex-row
↓
no desktop, mudar para linha
```

---

# 30. Regra de ouro

Não tente decorar 100 classes.

Aprenda a reconhecer os padrões:

```text
mt → margin-top
mb → margin-bottom
ml → margin-left
mr → margin-right

p → padding
px → padding horizontal
py → padding vertical

w → width
h → height
max-w → largura máxima

text → tamanho/cor/alinhamento do texto
font → peso da fonte

bg → background
border → borda
rounded → arredondamento
shadow → sombra

flex → Flexbox
items → align-items
justify → justify-content
gap → espaço entre elementos

md: → regra para telas maiores
lg: → regra para telas ainda maiores

hover: → quando o mouse passa por cima
```

A partir daí você consegue **montar classes novas sozinho**, em vez de depender de mim para cada linha.