package br.com.economiabr.api.dto;

public record SelicResponse(
        String data,
        String dataFormatada,
        String indicador,
        double valor,
        String unidade,
        String fonte
) {
}
