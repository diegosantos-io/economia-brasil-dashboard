package br.com.economiabr.api.dto;

public record CambioResponse(
        String data,
        double compra,
        double venda,
        String moeda,
        String fonte
) {
}