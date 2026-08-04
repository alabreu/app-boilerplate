/**
 * Design system do app: a ÚNICA porta de entrada para estilo de UI.
 *
 * Regra (ver CLAUDE.md): tela nova compõe estes primitivos. Classe crua do
 * Tailwind só para layout local (flex, gap, grid) ou quando o caso realmente não
 * existe aqui — e aí o certo é adicionar a variante ao primitivo, não deixar a
 * classe solta na tela.
 *
 * Os tokens (cor, raio, espaçamento, tipografia) vivem no @theme de
 * src/index.css. Trocar a identidade visual de um app é mexer lá, não aqui.
 */
export { Button, buttonClasses } from './Button'
export type { ButtonProps, ButtonSize, ButtonVariant } from './Button'
export { Card } from './Card'
export type { CardPadding, CardProps } from './Card'
export { Chip } from './Chip'
export type { ChipProps } from './Chip'
export { Field, Input, Textarea } from './Field'
export type { FieldProps } from './Field'
export { IconButton } from './IconButton'
export type { IconButtonProps } from './IconButton'
export { Screen, ScreenBody } from './Screen'
export type { ScreenBodyProps } from './Screen'
export { SectionTitle } from './SectionTitle'
export type { SectionTitleProps } from './SectionTitle'
export { Sheet } from './Sheet'
export type { SheetProps } from './Sheet'
