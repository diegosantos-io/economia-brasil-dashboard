package br.com.economiabr.api.dto;

public record PibResponse(
        String periodo,
        String periodoFormatado,
        double valorNominal,
        String unidadeNominal,
        double crescimento,
        String unidadeCrescimento,
        String fonte
) {
}
