package br.com.economiabr.api.client;

import tools.jackson.databind.JsonNode;
import org.springframework.stereotype.Component;
import org.springframework.web.client.RestClient;

import java.net.URI;
import java.time.LocalDate;
import java.time.format.DateTimeFormatter;

@Component
public class BancoCentralClient {

    private final RestClient restClient;

    private static final DateTimeFormatter FORMATO_DATA =
            DateTimeFormatter.ofPattern("dd/MM/yyyy");

    public BancoCentralClient() {
        this.restClient = RestClient.builder()
                .baseUrl("https://api.bcb.gov.br")
                .build();
    }

    public JsonNode buscarSelic(int dias) {

        if (dias < 1 || dias > 3650) {
            throw new IllegalArgumentException(
                    "O período deve estar entre 1 e 3650 dias."
            );
        }

        LocalDate fim = LocalDate.now();
        LocalDate inicio = fim.minusDays(dias - 1L);

        String dataInicial = inicio.format(FORMATO_DATA);
        String dataFinal = fim.format(FORMATO_DATA);

        String endpoint = "/dados/serie/bcdata.sgs.432/dados"
                + "?formato=json"
                + "&dataInicial=" + dataInicial
                + "&dataFinal=" + dataFinal;

        return restClient.get()
                .uri(URI.create(endpoint))
                .retrieve()
                .body(JsonNode.class);
    }

    public JsonNode buscarCambio(int dias) {

        if (dias < 1 || dias > 3650) {
            throw new IllegalArgumentException(
                    "O período deve estar entre 1 e 3650 dias."
            );
        }

        LocalDate fim = LocalDate.now();
        LocalDate inicio = fim.minusDays(dias - 1L);

        String dataInicial = inicio.format(FORMATO_DATA);
        String dataFinal = fim.format(FORMATO_DATA);

        String endpoint = "/dados/serie/bcdata.sgs.1/dados"
                + "?formato=json"
                + "&dataInicial=" + dataInicial
                + "&dataFinal=" + dataFinal;

        return restClient.get()
                .uri(URI.create(endpoint))
                .retrieve()
                .body(JsonNode.class);
    }

    public JsonNode buscarCambioCompra(int dias) {

        if (dias < 1 || dias > 3650) {
            throw new IllegalArgumentException(
                    "O período deve estar entre 1 e 3650 dias."
            );
        }

        LocalDate fim = LocalDate.now();
        LocalDate inicio = fim.minusDays(dias - 1L);

        String dataInicial = inicio.format(FORMATO_DATA);
        String dataFinal = fim.format(FORMATO_DATA);

        String endpoint = "/dados/serie/bcdata.sgs.10813/dados"
                + "?formato=json"
                + "&dataInicial=" + dataInicial
                + "&dataFinal=" + dataFinal;

        return restClient.get()
                .uri(URI.create(endpoint))
                .retrieve()
                .body(JsonNode.class);
    }
}
